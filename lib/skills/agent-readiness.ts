import * as cheerio from "cheerio";
import { assertPublicUrl, safeFetch, UnsafeUrlError, type SafeResponse } from "../safe-fetch";
import { isoDate, SkillInputError, type SkillHandler } from "./types";

type Status = "pass" | "warn" | "fail";
type Check = { id: string; label: string; status: Status; detail: string };

const AI_CRAWLERS = ["GPTBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot", "ChatGPT-User"];
const looksLikeHtml = (b: string) => /^\s*(<!doctype html|<html|<head|<body)/i.test(b);

async function get(url: string, accept = "*/*"): Promise<SafeResponse | null> {
  try {
    return await safeFetch(url, { maxBytes: 400_000, timeoutMs: 6000, accept });
  } catch (e) {
    if (e instanceof UnsafeUrlError) throw e;
    return null;
  }
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

// Which AI crawlers does robots.txt shut out? Reads only the groups that name them (or "*").
function robotsBlocks(robots: string): { all: boolean; named: string[] } {
  const groups: { agents: string[]; disallowAll: boolean }[] = [];
  let cur: { agents: string[]; disallowAll: boolean } | null = null;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) { cur = { agents: [], disallowAll: false }; groups.push(cur); }
      cur.agents.push(m[2].trim().toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (key === "disallow" && cur && m[2].trim() === "/") cur.disallowAll = true;
      if (key === "allow" && cur && m[2].trim() === "/") cur.disallowAll = false;
    }
  }
  const all = groups.some((g) => g.agents.includes("*") && g.disallowAll);
  const named = AI_CRAWLERS.filter((c) => groups.some((g) => g.agents.includes(c.toLowerCase()) && g.disallowAll));
  return { all, named };
}

export const agentReadiness: SkillHandler = {
  validate(input) {
    const url = input.url;
    if (typeof url !== "string" || !url.trim()) throw new SkillInputError("url is required");
    assertSafe(normalize(url));
  },
  async run(input) {
    const origin = normalize(String(input.url));
    const [home, md, llms, robots, sitemap, card, openapi] = await Promise.all([
      get(origin + "/", "text/html,application/xhtml+xml"),
      get(origin + "/", "text/markdown"),
      get(origin + "/llms.txt"),
      get(origin + "/robots.txt"),
      get(origin + "/sitemap.xml"),
      get(origin + "/.well-known/agent-card.json"),
      get(origin + "/openapi.json"),
    ]);

    const checks: Check[] = [];
    const add = (id: string, label: string, status: Status, detail: string) => checks.push({ id, label, status, detail });

    if (!home || home.status >= 500 || home.status === 0) {
      return {
        url: origin, reachable: false, score: 0,
        checks: [{ id: "reachable", label: "Home page loads", status: "fail", detail: home ? `The server answered ${home.status}.` : "The site could not be reached." }],
        top_fixes: ["Make the site reachable over HTTPS, then run the check again."],
        checked_at: isoDate(),
      };
    }

    add("reachable", "Home page loads", home.status === 200 ? "pass" : "warn", `Answered ${home.status}${home.redirects.length ? ` after ${home.redirects.length} redirect(s)` : ""}.`);

    const $ = cheerio.load(home.body);
    const title = $("title").first().text().trim();
    const desc = $('meta[name="description"]').attr("content")?.trim() ?? "";
    add("title", "Page title", title ? (title.length <= 70 ? "pass" : "warn") : "fail", title ? `"${title.slice(0, 90)}" (${title.length} characters).` : "No <title> found.");
    add("description", "Meta description", desc ? (desc.length >= 50 && desc.length <= 170 ? "pass" : "warn") : "fail", desc ? `${desc.length} characters.` : "No meta description found.");
    add("lang", "Page language", $("html").attr("lang") ? "pass" : "warn", $("html").attr("lang") ? `Declared as "${$("html").attr("lang")}".` : "The <html> tag has no lang attribute.");
    add("canonical", "Canonical URL", $('link[rel="canonical"]').attr("href") ? "pass" : "warn", $('link[rel="canonical"]').attr("href") ? "A canonical link is set." : "No canonical link found.");

    const ldTypes: string[] = [];
    let ldBad = 0;
    $('script[type="application/ld+json"]').each((_, el) => {
      const v = parseJson($(el).contents().text());
      if (v === undefined) { ldBad++; return; }
      const nodes = Array.isArray(v) ? v : [v];
      for (const n of nodes) {
        const t = (n as { "@type"?: unknown })?.["@type"];
        if (typeof t === "string") ldTypes.push(t);
        else if (Array.isArray(t)) ldTypes.push(...t.filter((x): x is string => typeof x === "string"));
      }
    });
    add("structured_data", "Structured data (JSON-LD)", ldTypes.length ? "pass" : ldBad ? "fail" : "warn",
      ldTypes.length ? `Found: ${[...new Set(ldTypes)].slice(0, 8).join(", ")}.` : ldBad ? "JSON-LD is present but does not parse." : "No JSON-LD found.");

    const llmsOk = llms && llms.status === 200 && !looksLikeHtml(llms.body) && llms.body.trim().length > 20;
    add("llms_txt", "llms.txt", llmsOk ? "pass" : "fail", llmsOk ? `Found (${llms!.body.length} characters).` : "No llms.txt at /llms.txt.");

    const mdOk = md && md.status === 200 && /markdown/i.test(md.headers["content-type"] ?? "");
    add("markdown", "Markdown version of the page", mdOk ? "pass" : "warn", mdOk ? "The home page answers Accept: text/markdown with markdown." : "The home page does not return markdown when asked for it.");

    const robotsOk = robots && robots.status === 200 && !looksLikeHtml(robots.body);
    add("robots", "robots.txt", robotsOk ? "pass" : "warn", robotsOk ? "Found." : "No robots.txt at /robots.txt.");
    if (robotsOk) {
      const b = robotsBlocks(robots!.body);
      add("ai_crawlers", "AI crawlers allowed", b.all ? "fail" : b.named.length ? "warn" : "pass",
        b.all ? "robots.txt blocks every crawler (Disallow: /)." : b.named.length ? `robots.txt blocks: ${b.named.join(", ")}.` : "robots.txt does not block the common AI crawlers.");
    }

    const robotsSitemap = robotsOk && /^\s*sitemap\s*:/im.test(robots!.body);
    const sitemapOk = sitemap && sitemap.status === 200 && /<(urlset|sitemapindex)\b/i.test(sitemap.body);
    add("sitemap", "Sitemap", sitemapOk || robotsSitemap ? "pass" : "warn", sitemapOk ? "Found at /sitemap.xml." : robotsSitemap ? "Listed in robots.txt." : "No sitemap found.");

    const cardJson = card && card.status === 200 ? (parseJson(card.body) as { name?: unknown; skills?: unknown } | undefined) : undefined;
    add("agent_card", "Agent card (/.well-known/agent-card.json)", cardJson && typeof cardJson === "object" && cardJson.name ? "pass" : "warn",
      cardJson && cardJson.name ? `Found for "${String(cardJson.name).slice(0, 80)}".` : "No agent card found. Optional, but it lets other agents discover what your site offers.");

    const oaJson = openapi && openapi.status === 200 ? (parseJson(openapi.body) as { openapi?: unknown } | undefined) : undefined;
    add("openapi", "OpenAPI description (/openapi.json)", oaJson && oaJson.openapi ? "pass" : "warn",
      oaJson && oaJson.openapi ? "Found." : "No OpenAPI file at /openapi.json. Only matters if the site has an API.");

    const weight = { pass: 1, warn: 0.5, fail: 0 } as const;
    const score = Math.round((100 * checks.reduce((n, c) => n + weight[c.status], 0)) / checks.length);
    const order = { fail: 0, warn: 1, pass: 2 } as const;
    const top_fixes = checks
      .filter((c) => c.status !== "pass")
      .sort((a, b) => order[a.status] - order[b.status])
      .slice(0, 3)
      .map((c) => `${c.label}: ${c.detail}`);

    return { url: origin, reachable: true, score, checks, top_fixes, checked_at: isoDate() };
  },
};

function normalize(raw: string): string {
  let t = raw.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = "https://" + t;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    throw new SkillInputError("url is not a valid address");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new SkillInputError("only http and https addresses are allowed");
  try {
    return new URL(u.origin).origin;
  } catch {
    throw new SkillInputError("url is not a valid address");
  }
}

function assertSafe(url: string) {
  try {
    assertPublicUrl(url);
  } catch (e) {
    if (e instanceof UnsafeUrlError) throw new SkillInputError(e.message);
    throw e;
  }
}
