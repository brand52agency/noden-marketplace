// Credit pricing and the cost model that keeps it profitable.
//
// 1 credit = $0.01 of marketplace spend (NODEN_PRICING_TASKS.md A1). A listing's credit
// price is the HIGHEST of:
//   1. its sats price at a fixed reference rate (so credits and sats stay consistent),
//   2. MIN_CREDITS_PER_CALL,
//   3. the credits needed so that even the WORST call (largest allowed input, longest
//      allowed output) still leaves MIN_WORST_CASE_MARGIN of gross margin when the credit
//      was bought at the cheapest rate Noden ever sells one.
// Rule 3 only holds because createOrder enforces MAX_INPUT_CHARS, so keep the two together.

import prices from "./credit-prices.json";

export const CREDIT_USD = 0.01;
export const MIN_CREDITS_PER_CALL = 5;

// Fixed on purpose: credit prices must not float with the bitcoin price. Review quarterly
// (last set 2026-10-11, BTC ≈ $83,005) and regenerate with `npm run credits:generate`.
export const REFERENCE_USD_PER_BTC = 83_000;

// ---- What a call costs Noden (lib/fulfillment.ts: claude-haiku-4-5, forced tool_choice) ----
export const MODEL_PRICING = { inputUsdPerMTok: 1, outputUsdPerMTok: 5 }; // Claude Haiku 4.5
export const FULFILLMENT_MAX_OUTPUT_TOKENS = 2048; // must match max_tokens in lib/fulfillment.ts
// Hard ceiling on the JSON input of any order. Without it, 72 of 173 listings accept unbounded
// arrays and one call could cost ~20¢ (200K input tokens) against a few cents of revenue.
export const MAX_INPUT_CHARS = 24_000;
export const MAX_REQUEST_BODY_BYTES = 100_000;

const CHARS_PER_TOKEN = 3; // conservative for JSON (prose is closer to 4)
const PRETTY_PRINT_FACTOR = 1.15; // fulfillment sends JSON.stringify(input, null, 2)
const FIXED_PROMPT_TOKENS = 580; // our instructions (~230) + forced-tool-use overhead (~350)
const TYPICAL_INPUT_CHARS = 1500;

// ---- What Noden earns per credit ----
// Source: marketing repo lib/plans.ts and NODEN_PRICING_TASKS.md A2. Keep in sync.
export const PLAN_ECONOMICS = [
  { name: "Starter, monthly", usd: 9, credits: 1_000 },
  { name: "Starter, annual", usd: 90, credits: 12_000 },
  { name: "Builder, monthly", usd: 29, credits: 4_000 },
  { name: "Builder, annual", usd: 290, credits: 48_000 },
  { name: "Pro, monthly", usd: 79, credits: 12_000 },
  { name: "Pro, annual", usd: 790, credits: 144_000 },
  { name: "Top-up 1,000", usd: 12, credits: 1_000 },
  { name: "Top-up 5,000", usd: 55, credits: 5_000 },
  { name: "Top-up 12,000", usd: 120, credits: 12_000 },
] as const;

// Stripe card fee (2.9% + 30¢) plus Stripe Billing (~0.7% of recurring volume).
const PAYMENT_FEES = { pct: 0.036, fixedUsd: 0.3 };

export const netUsdPerCredit = (e: { usd: number; credits: number }) =>
  (e.usd - e.usd * PAYMENT_FEES.pct - PAYMENT_FEES.fixedUsd) / e.credits;

// Planning with the cheapest credit Noden ever sells, minus 5% for tax, refunds and chargebacks.
export const NET_FLOOR_USD_PER_CREDIT = Math.min(...PLAN_ECONOMICS.map(netUsdPerCredit)) * 0.95;

// Even the worst allowed call must keep this much gross margin at the floor revenue.
export const MIN_WORST_CASE_MARGIN = 0.2;
// A typical call should earn at least this at the floor (checked by scripts/generate-credit-prices.ts).
export const MIN_TYPICAL_MARGIN = 0.6;

export type PricedListing = {
  id: string;
  priceSats: number;
  details?: string | null;
  description?: string | null;
  inputSchema: unknown;
  outputSchema: unknown;
  // Code-backed skills (lib/skills) make no model call, so the token cost model doesn't apply.
  handler?: string | null;
};

// What a code-backed call costs Noden: a few outbound requests and some compute, not tokens.
const HANDLER_NOMINAL_COST_USD = 0.0005;

// Largest JSON a schema-valid input can be, in characters; Infinity when the schema has no bound.
export function schemaMaxInputChars(schema: unknown): number {
  const worst = (s: unknown): number => {
    if (!s || typeof s !== "object") return Infinity;
    const x = s as Record<string, unknown>;
    if (Array.isArray(x.enum)) return Math.max(...x.enum.map((e) => JSON.stringify(e).length));
    switch (x.type) {
      case "string":
        return typeof x.maxLength === "number" ? x.maxLength + 2 : Infinity;
      case "number":
      case "integer":
        return 24;
      case "boolean":
        return 5;
      case "array": {
        const item = worst(x.items);
        return typeof x.maxItems === "number" ? x.maxItems * (item + 1) + 2 : Infinity;
      }
      default: {
        const props = x.properties as Record<string, unknown> | undefined;
        if (!props) return Infinity;
        let sum = 2;
        for (const [k, v] of Object.entries(props)) sum += k.length + 4 + worst(v);
        return sum;
      }
    }
  };
  return worst(schema);
}

export const effectiveMaxInputChars = (l: Pick<PricedListing, "inputSchema">) =>
  Math.min(schemaMaxInputChars(l.inputSchema), MAX_INPUT_CHARS);

function typicalOutputTokens(outputSchema: unknown): number {
  const s = outputSchema as { properties?: Record<string, unknown> } | null;
  const fields = Object.keys(s?.properties ?? {}).length;
  const hasArray = /"type":"array"/.test(JSON.stringify(outputSchema ?? {}));
  return Math.min(1200, Math.max(120, 60 + 45 * fields + (hasArray ? 350 : 0)));
}

export function costUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens * MODEL_PRICING.inputUsdPerMTok + outputTokens * MODEL_PRICING.outputUsdPerMTok) / 1_000_000;
}

function promptTokens(l: PricedListing, inputChars: number): number {
  const system = Math.ceil((l.details ?? l.description ?? "").length / 3.5);
  const tool = Math.ceil(JSON.stringify(l.outputSchema ?? {}).length / CHARS_PER_TOKEN) + 40;
  const input = Math.ceil((inputChars * PRETTY_PRINT_FACTOR) / CHARS_PER_TOKEN);
  return FIXED_PROMPT_TOKENS + system + tool + input;
}

// The most one call can cost: biggest allowed input, output at the max_tokens ceiling.
export const worstCaseCostUsd = (l: PricedListing) =>
  l.handler ? HANDLER_NOMINAL_COST_USD : costUsd(promptTokens(l, effectiveMaxInputChars(l)), FULFILLMENT_MAX_OUTPUT_TOKENS);

// An ordinary call: ~1,500 characters of input and a schema-sized output.
export const typicalCostUsd = (l: PricedListing) =>
  l.handler ? HANDLER_NOMINAL_COST_USD : costUsd(promptTokens(l, Math.min(TYPICAL_INPUT_CHARS, effectiveMaxInputChars(l))), typicalOutputTokens(l.outputSchema));

export const satsToCredits = (sats: number) =>
  Math.ceil((sats / 100_000_000) * REFERENCE_USD_PER_BTC / CREDIT_USD);

export function creditBreakdown(l: PricedListing) {
  // A free skill costs the buyer nothing; its limits live in lib/free-skills.ts.
  if (l.handler && l.priceSats === 0) {
    return { credits: 0, fromSats: 0, fromWorstCase: 0, typicalCostUsd: HANDLER_NOMINAL_COST_USD, worstCaseCostUsd: HANDLER_NOMINAL_COST_USD, floorRevenueUsd: 0, typicalMargin: 1, worstCaseMargin: 1 };
  }
  const fromSats = satsToCredits(l.priceSats);
  const fromWorstCase = Math.ceil(worstCaseCostUsd(l) / (NET_FLOOR_USD_PER_CREDIT * (1 - MIN_WORST_CASE_MARGIN)));
  const credits = Math.max(MIN_CREDITS_PER_CALL, fromSats, fromWorstCase);
  const revenue = credits * NET_FLOOR_USD_PER_CREDIT;
  return {
    credits,
    fromSats,
    fromWorstCase,
    typicalCostUsd: typicalCostUsd(l),
    worstCaseCostUsd: worstCaseCostUsd(l),
    floorRevenueUsd: revenue,
    typicalMargin: 1 - typicalCostUsd(l) / revenue,
    worstCaseMargin: 1 - worstCaseCostUsd(l) / revenue,
  };
}

// The price buyers see. Snapshotted in credit-prices.json so a listing's price only changes
// when the file is regenerated on purpose; new listings fall back to the same formula.
export function priceCredits(l: PricedListing): number {
  if (l.handler && l.priceSats === 0) return 0;
  const snapshot = (prices as { prices: Record<string, number> }).prices[l.id];
  return snapshot ?? creditBreakdown(l).credits;
}

// For lists that only load id + sats (related/top listings, price ranges). Same snapshot as
// priceCredits; the cost-based rule only matters for listings missing from the snapshot, which
// `npm run credits:generate -- --check` reports.
export function priceCreditsLite(id: string, priceSats: number): number {
  if (priceSats === 0) return 0;
  const snapshot = (prices as { prices: Record<string, number> }).prices[id];
  return snapshot ?? Math.max(MIN_CREDITS_PER_CALL, satsToCredits(priceSats));
}

export const snapshotHasListing = (id: string) => id in (prices as { prices: Record<string, number> }).prices;

// Returns an error message when an order's JSON input is over the cap, else null.
export function inputTooLarge(input: unknown): string | null {
  const chars = JSON.stringify(input ?? {}).length;
  return chars > MAX_INPUT_CHARS
    ? `input too large: ${chars.toLocaleString()} characters, the maximum is ${MAX_INPUT_CHARS.toLocaleString()}. Send less data per call.`
    : null;
}
