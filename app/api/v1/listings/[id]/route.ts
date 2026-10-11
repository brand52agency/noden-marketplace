import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { outputFieldNames } from "@/lib/schema-preview";
import { describeReputation, REAL_COMPLETED_WHERE } from "@/lib/reputation";
import { priceCredits } from "@/lib/credits";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const listing = await db.listing.findUnique({
    where: { id },
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
      active: true,
      _count: { select: { orders: { where: REAL_COMPLETED_WHERE } } },
    },
  });
  if (!listing) {
    return NextResponse.json({ error: "unknown listing_id" }, { status: 404 });
  }
  // inputSchema stays full — needed to construct a valid purchase.
  // outputSchema is reduced to field names until after purchase.
  const { outputSchema, successRate, reputation, _count, details, ...rest } = listing;
  void details; // only needed to price an unsnapshotted listing; the prompt text is not part of this response
  const credits = priceCredits({ ...listing, outputSchema });
  return NextResponse.json({
    listing: {
      ...rest,
      priceCredits: credits,
      price_credits: credits,
      ...describeReputation({ successRate, reputation }, _count.orders),
      output_fields: outputFieldNames(outputSchema),
    },
  });
}
