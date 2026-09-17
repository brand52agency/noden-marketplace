import { NextResponse } from "next/server";
import { getOrderStatus, MarketplaceError } from "@/lib/marketplace";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const order = await getOrderStatus(id);
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof MarketplaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "could not check order status" }, { status: 500 });
  }
}
