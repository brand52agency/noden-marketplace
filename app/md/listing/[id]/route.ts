import { db } from "@/lib/db";
import { REAL_COMPLETED_WHERE } from "@/lib/reputation";
import { MARKDOWN_HEADERS, renderListingMarkdown } from "@/lib/listing-markdown";

// Reached via rewrites in next.config.ts: /marketplace/{id}.md and
// /marketplace/{id} with `Accept: text/markdown`.
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const listing = await db.listing.findUnique({
    where: { id },
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
      active: true,
      _count: { select: { orders: { where: REAL_COMPLETED_WHERE } } },
    },
  });
  if (!listing || !listing.active) {
    return new Response("# Not found\n\nUnknown or inactive listing.\n", {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
  const { _count, ...rest } = listing;
  return new Response(renderListingMarkdown({ ...rest, verifiedTrades: _count.orders }), {
    headers: MARKDOWN_HEADERS,
  });
}
