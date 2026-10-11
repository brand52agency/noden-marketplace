import { NextRequest, NextResponse } from "next/server";
import { MarketplaceError, registerSelfServeOperatorLimited } from "@/lib/marketplace";

// Public, no auth — an agent with no human-provisioned operator account can
// self-register here and get a spend-capped API key immediately, instead of
// a human filling out /signup first. See registerSelfServeOperator for the
// safety ceiling this is bounded by, and registerSelfServeOperatorLimited for
// the per-IP / per-network limits.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const requestedCap = typeof body?.spend_cap_sats === "number" ? body.spend_cap_sats : undefined;

  try {
    const result = await registerSelfServeOperatorLimited(request.headers, requestedCap);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof MarketplaceError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status, headers: err.retryAfterSec ? { "Retry-After": String(err.retryAfterSec) } : undefined }
      );
    }
    throw err;
  }
}
