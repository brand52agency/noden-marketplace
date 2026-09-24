import { NextRequest, NextResponse } from "next/server";
import { registerSelfServeOperator } from "@/lib/marketplace";

// Public, no auth — an agent with no human-provisioned operator account can
// self-register here and get a spend-capped API key immediately, instead of
// a human filling out /signup first. See registerSelfServeOperator for the
// safety ceiling this is bounded by.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const requestedCap = typeof body?.spend_cap_sats === "number" ? body.spend_cap_sats : undefined;

  const result = await registerSelfServeOperator(requestedCap);
  return NextResponse.json(result, { status: 201 });
}
