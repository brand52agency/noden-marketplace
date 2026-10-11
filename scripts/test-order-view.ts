// The public order response must never contain seller/account secrets, whatever the database row holds.
import assert from "node:assert/strict";
import { db } from "../lib/db";
import { presentOrder } from "../lib/order-view";

const FORBIDDEN = ["passwordHash", "apiKey", "email", "nwcConnection", "payoutLightningAddress", "seller", "sellerId", "buyerId", "details", "railPaymentHash", "platformFeeSats", "outputSchema", "inputSchema"];

function keysDeep(v: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
  else if (v && typeof v === "object" && !(v instanceof Date)) {
    for (const [k, x] of Object.entries(v)) {
      out.add(k);
      keysDeep(x, out);
    }
  }
  return out;
}

async function main() {
  // Real rows, loaded the same way getOrderStatus loads them (seller and listing included).
  const orders = await db.order.findMany({ take: 25, orderBy: { createdAt: "desc" }, include: { listing: true, seller: true } });
  assert.ok(orders.length > 0, "need at least one order to check");
  for (const o of orders) {
    const view = presentOrder(o);
    const keys = keysDeep(JSON.parse(JSON.stringify(view)));
    // `input`/`output` are the buyer's own data, so only check the structural keys we control.
    for (const k of Object.keys(view)) {
      assert.ok(!FORBIDDEN.includes(k), `order ${o.id} exposes top-level field "${k}"`);
    }
    assert.ok(!keys.has("seller") && !keys.has("passwordHash") && !keys.has("apiKey"), `order ${o.id} leaks account fields`);
    if (view.listing) assert.deepEqual(Object.keys(view.listing).sort(), ["category", "id", "name"]);
  }
  console.log(`PASS ${orders.length} real orders: response is a whitelist (no seller, keys, hashes, prompt or schemas)`);
  const ALLOWED = new Set(["amountSats", "createdAt", "failureNote", "id", "input", "invoice", "listing", "listingId", "message", "output", "paidAt", "retryToken", "retryTokenExpiresAt", "settledAt", "status", "verificationResult"]);
  for (const o of orders) {
    const defined = Object.entries(presentOrder(o)).filter(([, v]) => v !== undefined).map(([k]) => k);
    for (const k of defined) assert.ok(ALLOWED.has(k), `unexpected field "${k}" in the order response`);
  }
  console.log("PASS only whitelisted fields are ever present");
  await db.$disconnect();
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
