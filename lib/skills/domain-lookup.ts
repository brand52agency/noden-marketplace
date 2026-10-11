import dns from "node:dns/promises";
import { domainToASCII } from "node:url";
import { isoDate, SkillInputError, str, trustedJson, type SkillHandler } from "./types";

const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function normalize(raw: unknown): string {
  if (typeof raw !== "string") throw new SkillInputError("domain is required");
  const d = domainToASCII(raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, ""));
  if (!DOMAIN_RE.test(d)) throw new SkillInputError("domain is not a valid domain name, e.g. example.com");
  return d;
}

type RdapEvent = { eventAction?: string; eventDate?: string };
type RdapEntity = { roles?: string[]; vcardArray?: [string, [string, unknown, string, unknown][]] };

async function resolveSafe<T>(p: Promise<T>, empty: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "ENODATA" || code === "ENOTFOUND" || code === "ENOENT" || code === "ESERVFAIL" || code === "ETIMEOUT" || code === "ECONNREFUSED") return empty;
    throw e;
  }
}

export const domainLookup: SkillHandler = {
  validate: (input) => void normalize(input.domain),
  async run(input) {
    const domain = normalize(input.domain);

    // Registry data over RDAP (rdap.org forwards to the registry that runs the TLD).
    let registration: "registered" | "not_found_in_registry" | "unknown" = "unknown";
    let registrar: string | null = null;
    let created: string | null = null, expires: string | null = null, updated: string | null = null;
    let rdapNameservers: string[] = [];
    let statuses: string[] = [];
    try {
      const r = await trustedJson(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {}, 9000);
      if (r.status === 404) registration = "not_found_in_registry";
      else if (r.status === 200 && r.json && typeof r.json === "object") {
        registration = "registered";
        const j = r.json as { events?: RdapEvent[]; entities?: RdapEntity[]; nameservers?: { ldhName?: string }[]; status?: string[] };
        const ev = (a: string) => j.events?.find((e) => e.eventAction === a)?.eventDate ?? null;
        created = ev("registration");
        expires = ev("expiration");
        updated = ev("last changed");
        statuses = (j.status ?? []).slice(0, 10).map((s) => str(s, 60));
        rdapNameservers = (j.nameservers ?? []).map((n) => str(n.ldhName, 100).toLowerCase()).filter(Boolean).slice(0, 10);
        const reg = j.entities?.find((e) => e.roles?.includes("registrar"));
        const fn = reg?.vcardArray?.[1]?.find((p) => p[0] === "fn");
        registrar = fn ? str(fn[3], 120) || null : null;
      }
    } catch {
      /* registry unreachable: leave as unknown */
    }

    const resolver = new dns.Resolver({ timeout: 4000, tries: 1 });
    const [a, aaaa, mx, ns, txt] = await Promise.all([
      resolveSafe(resolver.resolve4(domain), [] as string[]),
      resolveSafe(resolver.resolve6(domain), [] as string[]),
      resolveSafe(resolver.resolveMx(domain), [] as { exchange: string; priority: number }[]),
      resolveSafe(resolver.resolveNs(domain), [] as string[]),
      resolveSafe(resolver.resolveTxt(domain), [] as string[][]),
    ]);

    const hasDns = a.length + aaaa.length + mx.length + ns.length > 0;
    // "Not found" at the registry is a strong signal, not a guarantee: reserved and premium names exist.
    const likelyAvailable = registration === "not_found_in_registry" ? !hasDns : registration === "registered" ? false : null;

    return {
      domain,
      registration_status: registration,
      likely_available: likelyAvailable,
      availability_note:
        registration === "not_found_in_registry"
          ? "The registry has no record of this name. Confirm with a registrar before relying on it: reserved and premium names can look unregistered."
          : registration === "registered"
            ? "This domain is registered."
            : "The registry could not be reached, so registration could not be confirmed.",
      registrar,
      created,
      expires,
      last_changed: updated,
      status: statuses,
      nameservers: (ns.length ? ns : rdapNameservers).map((n) => n.toLowerCase()).slice(0, 10),
      dns: {
        a: a.slice(0, 10),
        aaaa: aaaa.slice(0, 10),
        mx: mx.slice(0, 10).map((m) => ({ host: m.exchange.toLowerCase(), priority: m.priority })),
        txt: txt.slice(0, 10).map((t) => t.join("").slice(0, 300)),
      },
      source: "RDAP (rdap.org) and live DNS",
      checked_at: isoDate(),
    };
  },
};
