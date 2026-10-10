import { db } from "@/lib/db";
import { MARKDOWN_HEADERS, renderCatalogMarkdown } from "@/lib/listing-markdown";

// Reached via rewrites: /catalog.md and / with `Accept: text/markdown`.
export async function GET() {
  const listings = await db.listing.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { priceSats: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, description: true, priceSats: true },
  });
  return new Response(renderCatalogMarkdown(listings), { headers: MARKDOWN_HEADERS });
}
