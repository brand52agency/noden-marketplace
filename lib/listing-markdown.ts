import { outputFieldNames } from "@/lib/schema-preview";
import { describeReputation } from "@/lib/reputation";

const SITE = "https://shop.getnoden.com";

type MarkdownListing = {
  id: string;
  name: string;
  category: string;
  description: string;
  priceSats: number;
  avgLatencyMs: number;
  successRate: number;
  reputation: number;
  inputSchema: unknown;
  outputSchema: unknown;
  verifiedTrades: number;
};

// Markdown rendering of a listing for agents and LLM tools. It exposes only what
// the public listing page and /api/v1/listings/{id} already show: the full input
// schema, output field names (not the exact format), and honest reputation.
export function renderListingMarkdown(l: MarkdownListing): string {
  const rep = describeReputation({ successRate: l.successRate, reputation: l.reputation }, l.verifiedTrades);
  const fields = outputFieldNames(l.outputSchema);
  return [
    `# ${l.name}`,
    "",
    l.description,
    "",
    `- **Category:** ${l.category}`,
    `- **Price:** ${l.priceSats} sats per call (paid over Bitcoin Lightning; the first purchase on a new API key is free)`,
    `- **Listing id:** \`${l.id}\``,
    `- **Verified trades:** ${rep.verified_trades}`,
    `- **Success rate:** ${rep.success_rate === null ? "n/a (no completed trades yet)" : `${(rep.success_rate * 100).toFixed(0)}%`}`,
    `- **Reputation:** ${rep.reputation === null ? "unrated" : `${rep.reputation.toFixed(1)} / 5`}`,
    `- **Average latency:** ${l.avgLatencyMs > 0 ? `${l.avgLatencyMs} ms` : "n/a"}`,
    "",
    "## Input schema",
    "",
    "Your `input` must validate against this JSON Schema:",
    "",
    "```json",
    JSON.stringify(l.inputSchema, null, 2),
    "```",
    "",
    "## Output",
    "",
    fields.length
      ? `You get back an object with these fields: ${fields.map((f) => `\`${f}\``).join(", ")}. The exact format and values are delivered after purchase and checked against the listing's output schema before the order settles.`
      : "Output is delivered after purchase and checked against the listing's output schema before the order settles.",
    "",
    "## How to buy",
    "",
    "1. Get an API key (no human signup): `POST " + SITE + "/api/v1/operators`",
    `2. \`POST ${SITE}/api/v1/orders\` with \`Authorization: Bearer <key>\` and body \`{"listing_id": "${l.id}", "input": { ... }}\``,
    `3. Poll \`GET ${SITE}/api/v1/orders/{order_id}\` until \`status\` is \`settled\`; the verified output is included.`,
    "",
    `Or use the MCP server at ${SITE}/mcp (\`get_skill\`, \`purchase_skill\`). Full API: ${SITE}/openapi.json`,
    "",
    `HTML version: ${SITE}/marketplace/${l.id}`,
    "",
  ].join("\n");
}

type CatalogEntry = { id: string; name: string; category: string; description: string; priceSats: number };

export function renderCatalogMarkdown(listings: CatalogEntry[]): string {
  const byCategory = new Map<string, CatalogEntry[]>();
  for (const l of listings) byCategory.set(l.category, [...(byCategory.get(l.category) ?? []), l]);
  const prices = listings.map((l) => l.priceSats);
  const lines = [
    "# Noden skill catalog",
    "",
    `${listings.length} skills across ${byCategory.size} categories, ${Math.min(...prices)}–${Math.max(...prices)} sats per call. Each entry links to a markdown page with its input schema and purchase steps.`,
    "",
    `Search the live catalog: \`GET ${SITE}/api/v1/listings?q=\` · MCP: ${SITE}/mcp · OpenAPI: ${SITE}/openapi.json`,
    "",
  ];
  for (const category of [...byCategory.keys()].sort()) {
    lines.push(`## ${category}`, "");
    for (const l of byCategory.get(category)!) {
      lines.push(`- [${l.name}](${SITE}/marketplace/${l.id}.md) — ${l.priceSats} sats. ${l.description}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
  Vary: "Accept",
};
