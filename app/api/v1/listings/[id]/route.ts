import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { outputFieldNames } from "@/lib/schema-preview";
import { describeReputation, COMPLETED_ORDER_STATUSES } from "@/lib/reputation";

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
      _count: { select: { orders: { where: { status: { in: [...COMPLETED_ORDER_STATUSES] } } } } },
    },
  });
  if (!listing) {
    return NextResponse.json({ error: "unknown listing_id" }, { status: 404 });
  }
  // inputSchema stays full — needed to construct a valid purchase.
  // outputSchema is reduced to field names until after purchase.
  const { outputSchema, successRate, reputation, _count, ...rest } = listing;
  return NextResponse.json({
    listing: {
      ...rest,
      ...describeReputation({ successRate, reputation }, _count.orders),
      output_fields: outputFieldNames(outputSchema),
    },
  });
}
