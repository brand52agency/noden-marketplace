import { agentReadiness } from "./agent-readiness";
import { crawler } from "./crawler";
import { domainLookup } from "./domain-lookup";
import { fx } from "./fx";
import { osv } from "./osv";
import { webPageData } from "./web-page-data";
import type { SkillHandler } from "./types";

// Keyed by Listing.handler. Adding a skill here and a definition in scripts/add-catalog-skills.ts
// is all it takes; none of these call a language model.
export const SKILL_HANDLERS: Record<string, SkillHandler> = {
  "agent-readiness-check": agentReadiness,
  "web-page-to-clean-data": webPageData,
  "domain-availability-dns": domainLookup,
  "live-fx-conversion": fx,
  "dependency-cve-lookup": osv,
  "sitemap-link-crawler": crawler,
};

export const getSkillHandler = (key: string | null | undefined) => (key ? (SKILL_HANDLERS[key] ?? null) : null);
export { SkillInputError } from "./types";
