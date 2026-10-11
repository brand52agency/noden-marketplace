// Adds (or updates) the code-backed catalog skills as shop listings. For each one it validates the
// schemas, runs a REAL test call against the live source, checks the result against the output
// schema, and only then makes the listing active. A skill that fails stays inactive.
//   npx tsx scripts/add-catalog-skills.ts --dry-run   # test everything, write nothing
//   npx tsx scripts/add-catalog-skills.ts             # test and upsert
// Seller: the existing Noden seller account. Prices: docs/catalog-skills.md.
import assert from "node:assert/strict";
import { db } from "../lib/db";
import { verifyAgainstSchema } from "../lib/verify";
import { SKILL_HANDLERS } from "../lib/skills";
import { MAX_INPUT_CHARS, schemaMaxInputChars } from "../lib/credits";

const SELLER_EMAIL = "verified@agentixshop.dev";

type Def = {
  handler: string;
  name: string;
  category: string;
  description: string;
  details: string;
  priceSats: number; // 0 = free (limited, see lib/free-skills.ts)
  inputSchema: object;
  outputSchema: object;
  sample: Record<string, unknown>;
  check?: (out: Record<string, unknown>) => void;
};

const url = { type: "string", maxLength: 2000 };

export const DEFS: Def[] = [
  {
    handler: "agent-readiness-check",
    name: "Agent-Readiness Check",
    category: "Dev Tools",
    description: "Checks whether a website is easy for AI agents and search engines to find and read, and lists what to fix first.",
    details:
      "Looks at a live site's own files: the home page, llms.txt, robots.txt (and whether it blocks AI crawlers), the sitemap, structured data, a markdown version of the page, the agent card and the OpenAPI file. Returns a pass, warning or fail for each, an overall score out of 100, and the top three fixes. Everything comes from fetching the site itself; nothing is guessed. Free: limited per day.",
    priceSats: 0,
    inputSchema: { type: "object", required: ["url"], properties: { url } },
    outputSchema: {
      type: "object",
      required: ["url", "reachable", "score", "checks", "top_fixes", "checked_at"],
      properties: {
        url: { type: "string" },
        reachable: { type: "boolean" },
        score: { type: "integer", minimum: 0, maximum: 100 },
        checks: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "label", "status", "detail"],
            properties: { id: { type: "string" }, label: { type: "string" }, status: { enum: ["pass", "warn", "fail"] }, detail: { type: "string" } },
          },
        },
        top_fixes: { type: "array", items: { type: "string" } },
        checked_at: { type: "string" },
      },
    },
    sample: { url: "https://example.com" },
    check: (o) => {
      assert.equal(o.reachable, true);
      assert.ok((o.checks as unknown[]).length >= 8, "expected a full set of checks");
    },
  },
  {
    handler: "web-page-to-clean-data",
    name: "Web Page to Clean Data",
    category: "Data",
    description: "Fetches a web page and returns its title, headings, main text, links and structured data as clean JSON.",
    details:
      "Downloads the page at the address you give, strips scripts, menus and boilerplate, and returns the title, description, canonical link, language, headings, main text (up to 20,000 characters), up to 100 links marked internal or external, Open Graph tags and any JSON-LD. Only public pages are fetched; private and internal addresses are refused. Free: limited per day.",
    priceSats: 0,
    inputSchema: { type: "object", required: ["url"], properties: { url } },
    outputSchema: {
      type: "object",
      required: ["url", "reachable", "fetched_at"],
      properties: {
        url: { type: "string" },
        reachable: { type: "boolean" },
        status: { type: "integer" },
        title: { type: "string" },
        description: { type: "string" },
        text: { type: "string" },
        word_count: { type: "integer" },
        headings: { type: "array", items: { type: "object", required: ["level", "text"], properties: { level: { type: "integer" }, text: { type: "string" } } } },
        links: { type: "array", items: { type: "object", required: ["href"], properties: { href: { type: "string" }, text: { type: "string" }, internal: { type: "boolean" } } } },
        error: { type: "string" },
        fetched_at: { type: "string" },
      },
    },
    sample: { url: "https://example.com" },
    check: (o) => {
      assert.equal(o.reachable, true);
      assert.match(String(o.title), /Example Domain/);
      assert.ok(Number(o.word_count) > 5);
    },
  },
  {
    handler: "domain-availability-dns",
    name: "Domain Availability and DNS Lookup",
    category: "DevOps",
    description: "Checks whether a domain name is registered, who holds it and until when, and its live DNS records.",
    details:
      "Asks the domain's registry (over RDAP) whether the name is registered and returns the registrar, created and expiry dates and status flags, then looks up its live A, AAAA, MX, NS and TXT records. A name the registry has no record of is reported as likely available, with a reminder to confirm at a registrar since reserved and premium names can look free.",
    priceSats: 60,
    inputSchema: { type: "object", required: ["domain"], properties: { domain: { type: "string", maxLength: 253 } } },
    outputSchema: {
      type: "object",
      required: ["domain", "registration_status", "likely_available", "dns", "checked_at"],
      properties: {
        domain: { type: "string" },
        registration_status: { enum: ["registered", "not_found_in_registry", "unknown"] },
        likely_available: { type: ["boolean", "null"] },
        registrar: { type: ["string", "null"] },
        created: { type: ["string", "null"] },
        expires: { type: ["string", "null"] },
        nameservers: { type: "array", items: { type: "string" } },
        dns: { type: "object", required: ["a", "aaaa", "mx", "txt"], properties: { a: { type: "array" }, aaaa: { type: "array" }, mx: { type: "array" }, txt: { type: "array" } } },
        checked_at: { type: "string" },
      },
    },
    sample: { domain: "example.com" },
    check: (o) => {
      assert.equal(o.registration_status, "registered");
      assert.equal(o.likely_available, false);
      assert.ok((o.dns as { a: unknown[] }).a.length > 0, "example.com should resolve");
    },
  },
  {
    handler: "live-fx-conversion",
    name: "Live FX and Currency Conversion",
    category: "Finance",
    description: "Converts an amount between currencies at a published exchange rate and tells you the rate's date.",
    details:
      "Uses the European Central Bank's published reference rates (via Frankfurter) and returns the rate, the converted amount and the date the rate applies to. These are daily reference rates, not live trading quotes, so the rate date is always returned. Pass a date for a historical rate.",
    priceSats: 60,
    inputSchema: {
      type: "object",
      required: ["from", "to"],
      properties: { from: { type: "string", minLength: 3, maxLength: 3 }, to: { type: "string", minLength: 3, maxLength: 3 }, amount: { type: "number", minimum: 0, maximum: 1000000000000 }, date: { type: "string", maxLength: 10 } },
    },
    outputSchema: {
      type: "object",
      required: ["from", "to", "amount", "rate", "converted", "rate_date", "source"],
      properties: { from: { type: "string" }, to: { type: "string" }, amount: { type: "number" }, rate: { type: "number" }, converted: { type: "number" }, rate_date: { type: "string" }, source: { type: "string" } },
    },
    sample: { from: "USD", to: "EUR", amount: 100 },
    check: (o) => {
      assert.ok(Number(o.rate) > 0.3 && Number(o.rate) < 3, "USD to EUR rate should be near 1");
      assert.match(String(o.rate_date), /^\d{4}-\d{2}-\d{2}$/);
    },
  },
  {
    handler: "dependency-cve-lookup",
    name: "Dependency CVE Lookup",
    category: "Security",
    description: "Looks up known security vulnerabilities for up to 20 package versions in the OSV database.",
    details:
      "Give it package names and exact versions (npm, PyPI, Go, crates.io, Maven, RubyGems, NuGet, Packagist, Hex or Pub) and it queries OSV.dev, the open-source vulnerability database, returning for each package the advisories that affect that version: ID, aliases such as CVE numbers, summary, severity where published, and the versions that fix it. A package with no advisories returns an empty list, which means none are known, not that it is safe.",
    priceSats: 120,
    inputSchema: {
      type: "object",
      required: ["packages"],
      properties: {
        packages: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          items: {
            type: "object",
            required: ["ecosystem", "name", "version"],
            properties: { ecosystem: { enum: ["npm", "PyPI", "Go", "crates.io", "Maven", "RubyGems", "NuGet", "Packagist", "Hex", "Pub"] }, name: { type: "string", maxLength: 214 }, version: { type: "string", maxLength: 80 } },
          },
        },
      },
    },
    outputSchema: {
      type: "object",
      required: ["packages", "total_vulnerabilities", "source", "checked_at"],
      properties: {
        packages: { type: "array", items: { type: "object", required: ["name", "version", "vulnerability_count", "vulnerabilities"], properties: { name: { type: "string" }, version: { type: "string" }, vulnerability_count: { type: "integer" }, vulnerabilities: { type: "array" } } } },
        total_vulnerabilities: { type: "integer" },
        source: { type: "string" },
        checked_at: { type: "string" },
      },
    },
    sample: { packages: [{ ecosystem: "npm", name: "lodash", version: "4.17.15" }] },
    check: (o) => {
      assert.ok(Number(o.total_vulnerabilities) > 0, "lodash 4.17.15 has known advisories");
    },
  },
  {
    handler: "sitemap-link-crawler",
    name: "Sitemap and Broken Link Crawler",
    category: "Dev Tools",
    description: "Checks up to 50 pages of a site from its sitemap and reports broken links and redirects.",
    details:
      "Reads the site's sitemap (or, if there isn't one, the links on its home page), then requests up to 50 URLs on that same site and reports each one that returns an error, can't be reached, or redirects. Only the site you name is crawled. Pages are requested politely, five at a time, and the run stops after about 40 seconds.",
    priceSats: 180,
    inputSchema: { type: "object", required: ["url"], properties: { url, max_urls: { type: "integer", minimum: 1, maximum: 50 } } },
    outputSchema: {
      type: "object",
      required: ["site", "reachable", "source", "checked", "ok_count", "broken", "checked_at"],
      properties: {
        site: { type: "string" },
        reachable: { type: "boolean" },
        source: { enum: ["sitemap", "page_links"] },
        checked: { type: "integer" },
        ok_count: { type: "integer" },
        broken: { type: "array", items: { type: "object", required: ["url", "status"], properties: { url: { type: "string" }, status: { type: "integer" } } } },
        redirected: { type: "array" },
        truncated: { type: "boolean" },
        checked_at: { type: "string" },
      },
    },
    sample: { url: "https://example.com", max_urls: 5 },
    check: (o) => {
      assert.equal(o.reachable, true);
    },
  },
];

async function main() {
  const dry = process.argv.includes("--dry-run");
  const seller = await db.operator.findUnique({ where: { email: SELLER_EMAIL } });
  assert.ok(seller, `seller ${SELLER_EMAIL} not found`);
  let failures = 0;

  for (const d of DEFS) {
    process.stdout.write(`${d.name} ... `);
    try {
      assert.ok(SKILL_HANDLERS[d.handler], "no handler registered");
      assert.ok(Number.isFinite(schemaMaxInputChars(d.inputSchema)) && schemaMaxInputChars(d.inputSchema) <= MAX_INPUT_CHARS, "input schema must be bounded");
      assert.ok(d.name.length < 60);
      const inCheck = verifyAgainstSchema(d.sample, d.inputSchema);
      assert.ok(inCheck.valid, `sample fails its own input schema: ${inCheck.errors}`);
      SKILL_HANDLERS[d.handler].validate?.(d.sample);
      const t0 = Date.now();
      const out = await SKILL_HANDLERS[d.handler].run(d.sample);
      const ms = Date.now() - t0;
      const outCheck = verifyAgainstSchema(out, d.outputSchema);
      assert.ok(outCheck.valid, `real output fails its output schema: ${outCheck.errors}`);
      d.check?.(out);
      console.log(`test call passed in ${ms} ms`);
      if (!dry) {
        const data = {
          sellerId: seller.id, name: d.name, category: d.category, description: d.description, details: d.details,
          inputSchema: d.inputSchema, outputSchema: d.outputSchema, priceSats: d.priceSats, handler: d.handler, active: true,
        };
        await db.listing.upsert({ where: { handler: d.handler }, update: data, create: data });
      }
    } catch (e) {
      failures++;
      console.log("FAILED:", e instanceof Error ? e.message.slice(0, 300) : e);
      if (!dry) await db.listing.updateMany({ where: { handler: d.handler }, data: { active: false } });
    }
  }
  console.log(failures ? `\n${failures} skill(s) failed and were not activated.` : `\nAll ${DEFS.length} skills passed${dry ? " (dry run, nothing written)" : " and are active"}.`);
  await db.$disconnect();
  process.exit(failures ? 1 : 0);
}
if (process.argv[1]?.endsWith("add-catalog-skills.ts")) main();
