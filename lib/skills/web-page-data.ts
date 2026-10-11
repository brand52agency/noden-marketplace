import * as cheerio from "cheerio";
import { assertPublicUrl, safeFetch, UnsafeUrlError } from "../safe-fetch";
import { isoDate, SkillInputError, type SkillHandler } from "./types";

const MAX_TEXT = 20_000;

export const webPageData: SkillHandler = {
  validate(input) {
    if (typeof input.url !== "string" || !input.url.trim()) throw new SkillInputError("url is required");
    assertSafe(parse(input.url));
  },
  async run(input) {
    const url = parse(String(input.url));
    let res;
    try {
      res = await safeFetch(url, { maxBytes: 1_500_000, timeoutMs: 8000, accept: "text/html,application/xhtml+xml" });
    } catch (e) {
      if (e instanceof UnsafeUrlError) throw new SkillInputError(e.message);
      return { url, reachable: false, status: 0, error: "The page could not be fetched (timeout or connection error).", fetched_at: isoDate() };
    }
    const type = res.headers["content-type"] ?? "";
    if (res.status >= 400) return { url: res.url, reachable: false, status: res.status, error: `The server answered ${res.status}.`, fetched_at: isoDate() };
    if (!/html|xml/i.test(type)) return { url: res.url, reachable: true, status: res.status, error: `Not an HTML page (content type "${type.slice(0, 60)}").`, fetched_at: isoDate() };

    const $ = cheerio.load(res.body);
    const base = new URL(res.url);

    const json_ld: unknown[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      if (json_ld.length >= 5) return;
      try {
        const v = JSON.parse($(el).contents().text());
        if (JSON.stringify(v).length <= 8000) json_ld.push(v);
      } catch {
        /* skip unparseable block */
      }
    });
    const open_graph: Record<string, string> = {};
    $('meta[property^="og:"]').each((_, el) => {
      const k = ($(el).attr("property") ?? "").slice(3);
      const v = $(el).attr("content");
      if (k && v && Object.keys(open_graph).length < 20) open_graph[k] = v.slice(0, 300);
    });

    const headings: { level: number; text: string }[] = [];
    $("h1,h2,h3,h4").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text && headings.length < 60) headings.push({ level: Number(el.tagName.slice(1)), text: text.slice(0, 200) });
    });

    const links: { text: string; href: string; internal: boolean }[] = [];
    const seen = new Set<string>();
    $("a[href]").each((_, el) => {
      if (links.length >= 100) return;
      const raw = $(el).attr("href") ?? "";
      if (/^(javascript:|mailto:|tel:|#)/i.test(raw)) return;
      let abs: URL;
      try {
        abs = new URL(raw, base);
      } catch {
        return;
      }
      if (abs.protocol !== "http:" && abs.protocol !== "https:") return;
      abs.hash = "";
      if (seen.has(abs.toString())) return;
      seen.add(abs.toString());
      links.push({ text: $(el).text().replace(/\s+/g, " ").trim().slice(0, 120), href: abs.toString(), internal: abs.hostname === base.hostname });
    });

    const imageCount = $("img").length;
    $("script,style,noscript,svg,iframe,template,form,nav,footer,aside,header").remove();
    const root = $("main").length ? $("main").first() : $("article").length ? $("article").first() : $("body");
    const text = root.text().replace(/[ \t\f\v]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

    return {
      url: res.url,
      reachable: true,
      status: res.status,
      title: ($("title").first().text() || $("h1").first().text()).replace(/\s+/g, " ").trim().slice(0, 300),
      description: ($('meta[name="description"]').attr("content") ?? "").slice(0, 500),
      canonical: $('link[rel="canonical"]').attr("href") ?? null,
      language: $("html").attr("lang") ?? null,
      headings,
      text: text.slice(0, MAX_TEXT),
      word_count: text ? text.split(/\s+/).length : 0,
      links,
      image_count: imageCount,
      open_graph,
      json_ld,
      truncated: res.truncated || text.length > MAX_TEXT,
      fetched_at: isoDate(),
    };
  },
};

function parse(raw: string): string {
  let t = raw.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(t)) t = "https://" + t;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
    return u.toString();
  } catch {
    throw new SkillInputError("url is not a valid http or https address");
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
