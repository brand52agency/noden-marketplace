import { db } from "@/lib/db";
import { REAL_COMPLETED_WHERE } from "@/lib/reputation";
import { renderListingMarkdown } from "@/lib/listing-markdown";

// One document with every active listing in full, for LLM tools that prefer a
// single fetch over crawling the per-listing pages.
export const revalidate = 300;

export async function GET() {
  const listings = await db.listing.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      priceSats: true,
      avgLatencyMs: true,
      successRate: true,
      reputation: true,
      inputSchema: true,
      outputSchema: true,
      _count: { select: { orders: { where: REAL_COMPLETED_WHERE } } },
    },
  });
  const body = [
    "# Noden: full catalog",
    "",
    "Every active skill with its input schema. Overview and API: https://shop.getnoden.com/llms.txt",
    "",
    ...listings.map(({ _count, ...l }) => renderListingMarkdown({ ...l, verifiedTrades: _count.orders }) + "\n---\n"),
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
