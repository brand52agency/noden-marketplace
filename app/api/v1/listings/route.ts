import { NextRequest, NextResponse } from "next/server";
import { searchListings } from "@/lib/search";
import { logAction } from "@/lib/audit";
import { getOperatorByApiKey } from "@/lib/marketplace";

// Public, no auth — discovery must be frictionless for an agent.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const maxPriceParam = searchParams.get("max_price_sats");

  const listings = await searchListings({
    query,
    category,
    maxPriceSats: maxPriceParam ? Number(maxPriceParam) : undefined,
  });

  const apiKey = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (apiKey) {
    try {
      const operator = await getOperatorByApiKey(apiKey);
      await logAction(operator.id, "search", { query, category });
    } catch {
      // Search stays public even with a bad/missing key — logging is best-effort.
    }
  }

  return NextResponse.json({ listings });
}
