// Failed check -> single-use retry token (NODEN_PRICING_TASKS.md A3b). Runs against the real database.
// It relies on fulfillment NOT being configured locally (no ANTHROPIC_API_KEY), so every call fails
// its check, which is exactly the path under test. It spends no API money and deletes what it creates.
import assert from "node:assert/strict";
import { sampleInput } from "./_sample-input";
import { db } from "../lib/db";
import { FULFILLMENT_CONFIGURED } from "../lib/fulfillment";
import { MAX_RETRIES_PER_PAYMENT, createOrder, getOrderStatus, issueRetryToken } from "../lib/marketplace";
import { presentOrder } from "../lib/order-view";
import { apiKeyFields, generateApiKey } from "../lib/api-key";

if (FULFILLMENT_CONFIGURED) {
  console.log("SKIP: ANTHROPIC_API_KEY is set, so calls would really run. Unset it to run this test.");
  process.exit(0);
}

const TAG = `retrytest-${Date.now()}`;

async function operator(suffix: string) {
  const key = generateApiKey();
  const op = await db.operator.create({
    data: {
      email: `${TAG}-${suffix}@example.com`,
      passwordHash: "x",
      role: "buyer",
      emailVerifiedAt: new Date(),
      trialCallsRemaining: 1,
      spendCapDailySats: 5000,
      ...apiKeyFields(key),
    },
  });
  return { ...op, apiKey: key }; // plaintext, for the test only; the row holds just the hash
}

const validInput = sampleInput;

async function expectError(promise: Promise<unknown>, status: number, label: string) {
  try {
    await promise;
  } catch (e) {
    assert.equal((e as { status?: number }).status, status, `${label}: expected HTTP ${status}, got ${(e as { status?: number }).status}`);
    return;
  }
  assert.fail(`${label}: expected HTTP ${status}, but it succeeded`);
}

async function main() {
  const listing = await db.listing.findFirstOrThrow({
    where: { active: true, handler: null, priceSats: { lte: 150 } },
    orderBy: { priceSats: "asc" },
    select: { id: true, inputSchema: true },
  });
  const other = await db.listing.findFirstOrThrow({ where: { active: true, handler: null, id: { not: listing.id }, priceSats: { lte: 150 } }, select: { id: true, inputSchema: true } });
  const input = validInput(listing.inputSchema);
  const owner = await operator("owner");
  const thief = await operator("thief");
  const ids = [owner.id, thief.id];

  try {
    // 1. A verified account's free call fails its check -> failed + retry token, output not returned.
    const first = await createOrder(owner.apiKey, listing.id, input);
    assert.ok("free_trial" in first, "owner's first call should be the free trial");
    const failed1 = await getOrderStatus(first.order_id);
    assert.equal(failed1.status, "failed");
    const view1 = presentOrder(failed1);
    assert.equal(view1.status, "failed");
    assert.equal(view1.output, undefined, "failed output must not be returned");
    assert.ok(view1.retryToken?.startsWith("rt_"), "a failed check must issue a retry token");
    assert.ok(view1.message?.includes("retry_token"));
    // The trial is used up (no credit handed back, no loop).
    assert.equal((await db.operator.findUniqueOrThrow({ where: { id: owner.id } })).trialCallsRemaining, 0);
    console.log("PASS failed check -> status failed, no output, retry token issued, trial not restored");

    const token1 = view1.retryToken!;

    // 2. The token rules.
    await expectError(createOrder(owner.apiKey, other.id, validInput(other.inputSchema), undefined, token1), 403, "wrong listing");
    await expectError(createOrder(thief.apiKey, listing.id, input, undefined, token1), 403, "someone else's key");
    await expectError(createOrder(owner.apiKey, listing.id, input, undefined, "rt_doesnotexist"), 403, "unknown token");
    console.log("PASS token only works for the same listing and the same API key; unknown tokens are rejected alike");

    // 3. Redeeming gives one free call; the token is single-use even under concurrency.
    const results = await Promise.allSettled(Array.from({ length: 6 }, () => createOrder(owner.apiKey, listing.id, input, undefined, token1)));
    const ok = results.filter((r) => r.status === "fulfilled");
    assert.equal(ok.length, 1, `exactly one concurrent redemption may succeed, got ${ok.length}`);
    const retry1 = (ok[0] as PromiseFulfilledResult<{ order_id: string; free_retry?: true; amount_sats: number }>).value;
    assert.equal(retry1.free_retry, true);
    assert.equal(retry1.amount_sats, 0);
    await expectError(createOrder(owner.apiKey, listing.id, input, undefined, token1), 409, "reuse");
    console.log("PASS single-use: 6 simultaneous redemptions -> exactly 1 free retry; reuse -> 409");

    // 4. Expiry.
    await db.order.update({ where: { id: first.order_id }, data: { retryTokenUsedAt: null, retryTokenExpiresAt: new Date(Date.now() - 1000) } });
    await expectError(createOrder(owner.apiKey, listing.id, input, undefined, token1), 410, "expired");
    await db.order.update({ where: { id: first.order_id }, data: { retryTokenUsedAt: new Date(), retryTokenExpiresAt: new Date(Date.now() + 3600_000) } });
    console.log("PASS expired token -> 410");

    // 5. The retry also fails -> another token (depth 1), and then the cap stops the chain.
    const failed2 = await getOrderStatus(retry1.order_id);
    assert.equal(failed2.status, "failed");
    assert.equal(failed2.retryDepth, 1);
    const view2 = presentOrder(failed2);
    assert.ok(view2.retryToken, "second failure still earns a token (depth 1 < cap)");
    const retry2 = await createOrder(owner.apiKey, listing.id, input, undefined, view2.retryToken!);
    const failed3 = await getOrderStatus(retry2.order_id);
    assert.equal(failed3.retryDepth, 2);
    assert.equal(failed3.retryDepth, MAX_RETRIES_PER_PAYMENT);
    const view3 = presentOrder(failed3);
    assert.equal(view3.retryToken, undefined, "no token once the cap is reached");
    assert.ok(view3.message?.includes("No further free retries"));
    assert.equal(await issueRetryToken(retry2.order_id), null, "admin issuing past the cap returns null");
    console.log(`PASS chain stops at ${MAX_RETRIES_PER_PAYMENT} retries per payment (1 original + ${MAX_RETRIES_PER_PAYMENT} free = ${1 + MAX_RETRIES_PER_PAYMENT} attempts max)`);

    // 6. Retry orders are free and never count toward reputation or revenue.
    const chain = await db.order.findMany({ where: { buyerId: owner.id } });
    assert.ok(chain.every((o) => o.amountSats === 0));
    console.log("PASS retry orders are free (amountSats 0)");
  } finally {
    await db.order.deleteMany({ where: { buyerId: { in: ids } } });
    await db.auditLogEntry.deleteMany({ where: { operatorId: { in: ids } } });
    await db.trialClaim.deleteMany({ where: { operatorId: { in: ids } } });
    await db.operator.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  }
  console.log("\nAll retry-token checks passed.");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
