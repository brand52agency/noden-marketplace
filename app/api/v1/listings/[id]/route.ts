import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { outputFieldNames } from "@/lib/schema-preview";

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
      successRate: true,
      avgLatencyMs: true,
      reputation: true,
      inputSchema: true,
      outputSchema: true,
      active: true,
    },
  });
  if (!listing) {
    return NextResponse.json({ error: "unknown listing_id" }, { status: 404 });
  }
  // inputSchema stays full — needed to construct a valid purchase.
  // outputSchema is reduced to field names until after purchase.
  const { outputSchema, ...rest } = listing;
  return NextResponse.json({ listing: { ...rest, output_fields: outputFieldNames(outputSchema) } });
}
