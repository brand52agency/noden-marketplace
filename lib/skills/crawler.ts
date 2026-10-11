import * as cheerio from "cheerio";
import { assertPublicUrl, safeFetch, UnsafeUrlError } from "../safe-fetch";
import { isoDate, SkillInputError, type SkillHandler } from "./types";

const MAX_URLS_CAP = 50;
const DEFAULT_URLS = 25;
const CONCURRENCY = 5;
const TOTAL_BUDGET_MS = 40_000;

function origin(raw: unknown): URL {
  if (typeof raw !== "string" || !raw.trim()) throw new SkillInputError("url is required");
  let t = raw.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = "https://" + t;
  try {
    const u = assertPublicUrl(t);
    return new URL(u.origin);
  } catch (e) {
    if (e instanceof UnsafeUrlError) throw new SkillInputError(e.message);
    throw new SkillInputError("url is not a valid http or https address");
  }
}

function maxUrls(input: Record<string, unknown>): number {
  if (input.max_urls === undefined || input.max_urls === null) return DEFAULT_URLS;
  const n = Number(input.max_urls);
  if (!Number.isInteger(n) || n < 1 || n > MAX_URLS_CAP) throw new SkillInputError(`max_urls must be a whole number from 1 to ${MAX_URLS_CAP}`);
  return n;
}

const locs = (xml: string) => [...xml.matchAll(/<loc>\s*([^<\s][^<]*?)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));

export const crawler: SkillHandler = {
  validate(input) {
    origin(input.url);
    maxUrls(input);
  },
  async run(input) {
    const site = origin(input.url);
    const limit = maxUrls(input);
    const deadline = Date.now() + TOTAL_BUDGET_MS;

    // Where the URLs come from: the sitemap if there is one, else the links on the home page.
    let source: "sitemap" | "page_links" = "sitemap";
    let candidates: string[] = [];
    try {
      const sm = await safeFetch(site.origin + "/sitemap.xml", { maxBytes: 1_000_000, timeoutMs: 8000 });
      if (sm.status === 200 && /<(urlset|sitemapindex)\b/i.test(sm.body)) {
        candidates = locs(sm.body);
        if (/<sitemapindex\b/i.test(sm.body) && candidates[0]) {
          const child = await safeFetch(candidates[0], { maxBytes: 1_000_000, timeoutMs: 8000 }).catch(() => null);
          candidates = child && child.status === 200 ? locs(child.body) : [];
        }
      }
    } catch {
      /* fall through to page links */
    }
    if (candidates.length === 0) {
      source = "page_links";
      try {
        const home = await safeFetch(site.origin + "/", { maxBytes: 1_000_000, timeoutMs: 8000, accept: "text/html" });
        const $ = cheerio.load(home.body);
        $("a[href]").each((_, el) => {
          try {
            const u = new URL($(el).attr("href") ?? "", home.url);
            u.hash = "";
            if (/^https?:$/.test(u.protocol)) candidates.push(u.toString());
          } catch {
            /* ignore bad hrefs */
          }
        });
      } catch {
        return { site: site.origin, reachable: false, source, checked: 0, ok_count: 0, broken: [], redirected: [], truncated: false, checked_at: isoDate() };
      }
    }

    // Same host only: this skill must not become a way to probe other people's servers.
    const unique = [...new Set(candidates)].filter((u) => {
      try {
        return new URL(u).hostname === site.hostname;
      } catch {
        return false;
      }
    });
    const batch = unique.slice(0, limit);

    type Result = { url: string; status: number; final: string; hops: number; error?: string };
    const results: Result[] = [];
    let next = 0;
    async function worker() {
      while (next < batch.length && Date.now() < deadline) {
        const url = batch[next++];
        try {
          let r = await safeFetch(url, { method: "HEAD", timeoutMs: 6000 });
          // Some servers refuse HEAD; ask again with GET before calling the link broken.
          if ([403, 405, 501].includes(r.status)) r = await safeFetch(url, { method: "GET", maxBytes: 20_000, timeoutMs: 6000 });
          results.push({ url, status: r.status, final: r.url, hops: r.redirects.length });
        } catch (e) {
          results.push({ url, status: 0, final: url, hops: 0, error: e instanceof Error ? e.message.slice(0, 120) : "request failed" });
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const broken = results.filter((r) => r.status === 0 || r.status >= 400);
    return {
      site: site.origin,
      reachable: true,
      source,
      urls_found: unique.length,
      checked: results.length,
      ok_count: results.filter((r) => r.status >= 200 && r.status < 400).length,
      broken: broken.map((r) => ({ url: r.url, status: r.status, error: r.error ?? null })),
      redirected: results.filter((r) => r.hops > 0 && r.status < 400).map((r) => ({ url: r.url, final_url: r.final, hops: r.hops })),
      truncated: unique.length > batch.length || results.length < batch.length,
      checked_at: isoDate(),
    };
  },
};
