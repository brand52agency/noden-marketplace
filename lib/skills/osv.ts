import { isoDate, SkillInputError, str, trustedJson, type SkillHandler } from "./types";

const ECOSYSTEMS = ["npm", "PyPI", "Go", "crates.io", "Maven", "RubyGems", "NuGet", "Packagist", "Hex", "Pub"] as const;
const MAX_PACKAGES = 20;
const MAX_VULNS_PER_PACKAGE = 10;

type Pkg = { ecosystem: string; name: string; version: string };

function packages(input: Record<string, unknown>): Pkg[] {
  const list = input.packages;
  if (!Array.isArray(list) || list.length === 0) throw new SkillInputError("packages must be a non-empty list");
  if (list.length > MAX_PACKAGES) throw new SkillInputError(`at most ${MAX_PACKAGES} packages per call`);
  return list.map((p, i) => {
    const o = (p ?? {}) as Record<string, unknown>;
    const ecosystem = String(o.ecosystem ?? "");
    const name = String(o.name ?? "").trim();
    const version = String(o.version ?? "").trim();
    if (!(ECOSYSTEMS as readonly string[]).includes(ecosystem)) throw new SkillInputError(`packages[${i}].ecosystem must be one of ${ECOSYSTEMS.join(", ")}`);
    if (!name || name.length > 214) throw new SkillInputError(`packages[${i}].name is required`);
    if (!version || version.length > 80) throw new SkillInputError(`packages[${i}].version is required`);
    return { ecosystem, name, version };
  });
}

type OsvVuln = {
  id: string;
  aliases?: string[];
  summary?: string;
  published?: string;
  severity?: { type?: string; score?: string }[];
  database_specific?: { severity?: string };
  affected?: { ranges?: { events?: { fixed?: string }[] }[] }[];
};

export const osv: SkillHandler = {
  validate: (input) => void packages(input),
  async run(input) {
    const pkgs = packages(input);
    const batch = await trustedJson(
      "https://api.osv.dev/v1/querybatch",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ queries: pkgs.map((p) => ({ package: { name: p.name, ecosystem: p.ecosystem }, version: p.version })) }),
      },
      12000,
    );
    const results = (batch.json as { results?: { vulns?: { id: string }[] }[] } | null)?.results;
    if (batch.status !== 200 || !results || results.length !== pkgs.length) throw new Error("the vulnerability database did not answer");

    const ids = new Map<string, OsvVuln | null>();
    const wanted = new Set<string>();
    results.forEach((r) => (r.vulns ?? []).slice(0, MAX_VULNS_PER_PACKAGE).forEach((v) => wanted.add(v.id)));
    const list = [...wanted].slice(0, 80);
    for (let i = 0; i < list.length; i += 8) {
      await Promise.all(
        list.slice(i, i + 8).map(async (id) => {
          try {
            const r = await trustedJson(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`, {}, 8000);
            ids.set(id, r.status === 200 ? (r.json as OsvVuln) : null);
          } catch {
            ids.set(id, null);
          }
        }),
      );
    }

    return {
      packages: pkgs.map((p, i) => {
        const found = results[i].vulns ?? [];
        return {
          ecosystem: p.ecosystem,
          name: p.name,
          version: p.version,
          vulnerability_count: found.length,
          vulnerabilities: found.slice(0, MAX_VULNS_PER_PACKAGE).map((v) => {
            const d = ids.get(v.id);
            const fixed = (d?.affected ?? []).flatMap((a) => (a.ranges ?? []).flatMap((r) => (r.events ?? []).map((e) => e.fixed))).filter((x): x is string => !!x);
            return {
              id: v.id,
              aliases: (d?.aliases ?? []).slice(0, 6),
              summary: str(d?.summary, 300),
              severity: d?.database_specific?.severity ?? d?.severity?.[0]?.score ?? null,
              fixed_in: [...new Set(fixed)].slice(0, 6),
              published: d?.published ?? null,
              url: `https://osv.dev/vulnerability/${v.id}`,
            };
          }),
        };
      }),
      total_vulnerabilities: results.reduce((n, r) => n + (r.vulns?.length ?? 0), 0),
      source: "OSV.dev (open source vulnerability database)",
      checked_at: isoDate(),
    };
  },
};
