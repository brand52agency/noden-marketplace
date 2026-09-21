import { NextRequest, NextResponse } from "next/server";
import { createOrder, MarketplaceError } from "@/lib/marketplace";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const apiKey =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? body?.api_key;
  const listingId = body?.listing_id;
  const input = body?.input ?? {};

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "You don't have access yet. An operator API key is required to purchase (Authorization: Bearer <key>, or body.api_key). Ask your operator to set one up at https://shop.getnoden.com/signup, then connect a wallet and spend cap at /operator/setup.",
      },
      { status: 401 }
    );
  }
  if (!listingId) {
    return NextResponse.json({ error: "listing_id is required" }, { status: 400 });
  }

  try {
    const result = await createOrder(apiKey, listingId, input);
    return NextResponse.json(result, { status: 402 });
  } catch (err) {
    if (err instanceof MarketplaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "order creation failed" }, { status: 500 });
  }
}
