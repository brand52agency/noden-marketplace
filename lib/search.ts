import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { outputFieldNames } from "@/lib/schema-preview";
import { describeReputation, COMPLETED_ORDER_STATUSES } from "@/lib/reputation";

export const SEMANTIC_SEARCH_CONFIGURED = Boolean(process.env.OPENAI_API_KEY);

export type ListingSearchParams = {
  query?: string;
  category?: string;
  maxPriceSats?: number;
};

// Hybrid search per build spec §5: exact category/keyword filter, plus
// pgvector cosine-similarity on a query embedding for fuzzy capability
// matching. The vector half needs Postgres+pgvector and an embeddings
// key (see schema.prisma's datasource comment) — neither is available
// in local SQLite dev, so this degrades to keyword/category matching,
// which is fully functional on its own. Swapping in the vector branch
// once deployed on Postgres is additive: rank keyword hits first, then
// merge in nearest-neighbor hits on `Listing.embedding` for `query`.
export async function searchListings({ query, category, maxPriceSats }: ListingSearchParams) {
  const where: Prisma.ListingWhereInput = { active: true };

  if (category) {
    where.category = { equals: category };
  }
  if (typeof maxPriceSats === "number") {
    where.priceSats = { lte: maxPriceSats };
  }
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { description: { contains: query } },
      { details: { contains: query } },
      { category: { contains: query } },
    ];
  }

  const listings = await db.listing.findMany({
    where,
    orderBy: [{ reputation: "desc" }, { priceSats: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      details: true,
      priceSats: true,
      successRate: true,
      avgLatencyMs: true,
      reputation: true,
      inputSchema: true,
      outputSchema: true,
      _count: { select: { orders: { where: { status: { in: [...COMPLETED_ORDER_STATUSES] } } } } },
    },
  });

  // inputSchema stays full (needed to construct a valid purchase);
  // outputSchema is reduced to field names pre-purchase — see
  // lib/schema-preview.ts.
  return listings.map(({ outputSchema, successRate, reputation, _count, ...listing }) => ({
    ...listing,
    ...describeReputation({ successRate, reputation }, _count.orders),
    output_fields: outputFieldNames(outputSchema),
  }));
}
