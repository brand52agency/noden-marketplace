import { NextRequest, NextResponse } from "next/server";
import { createOrder, MarketplaceError } from "@/lib/marketplace";
import { MAX_REQUEST_BODY_BYTES } from "@/lib/credits";

export async function POST(request: NextRequest) {
  // Refuse oversized bodies before parsing them (the 24,000-character input cap is enforced in createOrder).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_REQUEST_BODY_BYTES) {
    return NextResponse.json({ error: `request body too large (max ${MAX_REQUEST_BODY_BYTES} bytes)` }, { status: 413 });
  }
  const raw = await request.text();
  if (raw.length > MAX_REQUEST_BODY_BYTES) {
    return NextResponse.json({ error: `request body too large (max ${MAX_REQUEST_BODY_BYTES} bytes)` }, { status: 413 });
  }
  let body: { api_key?: string; listing_id?: string; input?: Record<string, unknown>; retry_token?: string } | null = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }
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
    const retryToken = typeof body?.retry_token === "string" ? body.retry_token : undefined;
    const result = await createOrder(apiKey, listingId, input, undefined, retryToken);
    return NextResponse.json(result, { status: "free_trial" in result || "free_retry" in result ? 201 : 402 });
  } catch (err) {
    if (err instanceof MarketplaceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "order creation failed" }, { status: 500 });
  }
}
