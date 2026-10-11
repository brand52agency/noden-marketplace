// Invariants for credit pricing and the cost caps. Reads the live catalog (read-only) and
// makes one HTTP-free call into createOrder for the cap check, using a throwaway operator.
import assert from "node:assert/strict";
import { db } from "../lib/db";
import { hashApiKey } from "../lib/api-key";
import { createOrder, registerSelfServeOperator } from "../lib/marketplace";
import {
  MAX_INPUT_CHARS,
  MIN_CREDITS_PER_CALL,
  MIN_TYPICAL_MARGIN,
  MIN_WORST_CASE_MARGIN,
  NET_FLOOR_USD_PER_CREDIT,
  PLAN_ECONOMICS,
  creditBreakdown,
  inputTooLarge,
  netUsdPerCredit,
  priceCredits,
  priceCreditsLite,
  satsToCredits,
  schemaMaxInputChars,
  snapshotHasListing,
} from "../lib/credits";

async function main() {
  // --- unit economics ---
  const cheapestNet = Math.min(...PLAN_ECONOMICS.map(netUsdPerCredit));
  assert.ok(NET_FLOOR_USD_PER_CREDIT <= cheapestNet, "revenue floor must not exceed the cheapest net credit");
  assert.ok(NET_FLOOR_USD_PER_CREDIT > 0.004, "revenue floor looks wrong");
  console.log(`PASS revenue floor ${(NET_FLOOR_USD_PER_CREDIT * 100).toFixed(2)}¢ <= cheapest net credit ${(cheapestNet * 100).toFixed(2)}¢`);

  // --- conversion helper ---
  assert.equal(satsToCredits(50), 5);
  assert.equal(satsToCredits(500), 42);
  assert.equal(satsToCredits(1), 1);
  console.log("PASS sats -> credits at the fixed reference rate");

  // --- every listing ---
  const listings = await db.listing.findMany({
    where: { active: true },
    select: { id: true, name: true, priceSats: true, details: true, description: true, inputSchema: true, outputSchema: true },
  });
  assert.ok(listings.length > 100);
  for (const l of listings) {
    const b = creditBreakdown(l);
    assert.ok(snapshotHasListing(l.id), `${l.name} missing from credit-prices.json`);
    assert.equal(priceCredits(l), b.credits, `${l.name}: snapshot differs from the formula (regenerate?)`);
    assert.equal(priceCreditsLite(l.id, l.priceSats), b.credits);
    assert.ok(b.credits >= MIN_CREDITS_PER_CALL, `${l.name} below minimum`);
    assert.ok(b.credits >= b.fromSats, `${l.name} cheaper in credits than its sats price implies`);
    assert.ok(b.worstCaseMargin >= MIN_WORST_CASE_MARGIN - 1e-9, `${l.name} loses margin on a worst-case call`);
    assert.ok(b.typicalMargin >= MIN_TYPICAL_MARGIN, `${l.name} typical margin too thin`);
  }
  console.log(`PASS ${listings.length} listings: snapshot current, >= ${MIN_CREDITS_PER_CALL} credits, worst-case margin >= 20%, typical >= 60%`);

  // --- the cap is what makes the worst case finite ---
  const unbounded = listings.filter((l) => !Number.isFinite(schemaMaxInputChars(l.inputSchema)));
  assert.ok(unbounded.length > 0, "expected some listings with unbounded input (the reason the cap exists)");
  assert.equal(inputTooLarge({ x: "a".repeat(MAX_INPUT_CHARS) }) !== null, true);
  assert.equal(inputTooLarge({ x: "a".repeat(100) }), null);
  console.log(`PASS cap rejects > ${MAX_INPUT_CHARS} chars (${unbounded.length} listings rely on it)`);

  // --- end to end through createOrder: a SCHEMA-VALID but oversized input is refused with 413 ---
  // Build minimal valid values from a schema; unbounded arrays are padded until the JSON passes the cap.
  type S = { type?: string; enum?: unknown[]; minLength?: number; maxLength?: number; minimum?: number; maxItems?: number; minItems?: number; items?: S; properties?: Record<string, S> };
  const sample = (s: S | null | undefined, big: boolean): unknown => {
    if (!s || typeof s !== "object") return "x";
    if (Array.isArray(s.enum)) return s.enum[0];
    switch (s.type) {
      case "string": return s.maxLength == null && big ? "x".repeat(MAX_INPUT_CHARS + 500) : "x".repeat(Math.min(s.minLength ?? 1, s.maxLength ?? 50));
      case "number": case "integer": return Math.max(s.minimum ?? 1, 1);
      case "boolean": return true;
      case "array": {
        const n = s.maxItems != null ? s.maxItems : big ? 12000 : Math.max(s.minItems ?? 1, 1);
        return Array.from({ length: n }, () => sample(s.items, false)); // pad one level only
      }
      default: {
        const o: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(s.properties ?? {})) o[k] = sample(v, big);
        return o;
      }
    }
  };
  const { api_key } = await registerSelfServeOperator();
  let proven413 = 0;
  const unexpected: string[] = [];
  try {
    for (const l of unbounded) {
      const input = sample(l.inputSchema as S, true) as Record<string, unknown>;
      if (!inputTooLarge(input)) continue; // padding wasn't enough for this schema; skip it
      let status: number | undefined;
      try {
        await createOrder(api_key, l.id, input);
      } catch (e) {
        status = (e as { status?: number }).status;
      }
      if (status === 413) proven413++;
      else if (status !== 422) unexpected.push(`${l.name}: HTTP ${status}`); // 422 = padding broke a schema rule
    }
    assert.deepEqual(unexpected, [], "oversized input must never get past the cap");
    assert.ok(proven413 >= 15, `expected the cap (HTTP 413) to fire on several unbounded listings, fired on ${proven413}`);
    console.log(`PASS createOrder returns 413 for schema-valid oversized input (${proven413} listings exercised)`);
  } finally {
    await db.order.deleteMany({ where: { buyer: { apiKeyHash: hashApiKey(api_key) } } });
    await db.operator.deleteMany({ where: { apiKeyHash: hashApiKey(api_key) } });
  }
  await db.$disconnect();
  console.log("\nAll credit-pricing checks passed.");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
