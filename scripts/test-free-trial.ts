// Acceptance test for the free-trial rules (NODEN_PRICING_TASKS.md F1).
// Needs the schema applied (Operator.emailVerifiedAt, TrialClaim, EmailVerificationToken).
// Stubs the Lightning rail so no real invoices are created, and deletes everything it makes.
import assert from "node:assert/strict";
import { createHash, randomBytes } from "crypto";
import { db } from "../lib/db";
import { paymentRail } from "../lib/payments";
import { createOrder, registerSelfServeOperator } from "../lib/marketplace";
import { verifyEmailToken } from "../lib/verification";
import { apiKeyFields, generateApiKey } from "../lib/api-key";

const TAG = `f1test-${Date.now()}`;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
let stubbedInvoices = 0;
paymentRail.createPaymentRequest = async () => {
  stubbedInvoices++;
  return {
    id: `stub_${randomBytes(8).toString("hex")}`,
    amountSats: 0,
    railInvoiceRef: "lnbc-stub",
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
    status: "pending" as const,
  };
};

async function humanOperator(email: string) {
  const key = generateApiKey();
  const op = await db.operator.create({
    data: { email, passwordHash: "x", role: "buyer", spendCapDailySats: 5000, allowAllSellers: true, ...apiKeyFields(key) },
  });
  return { ...op, apiKey: key }; // plaintext, for the test only; the row holds just the hash
}
async function verifyNow(operatorId: string) {
  const token = randomBytes(32).toString("hex");
  await db.emailVerificationToken.create({ data: { operatorId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 3600_000) } });
  return { token, result: await verifyEmailToken(token) };
}

async function main() {
  const cheap = await db.listing.findFirstOrThrow({ where: { active: true, priceSats: { lte: 150 } }, orderBy: { priceSats: "asc" } });
  const pricey = await db.listing.findFirstOrThrow({ where: { active: true, priceSats: { gt: 150 } } });
  const input = (l: { inputSchema: unknown }) => {
    // Minimal valid input: fill required string fields.
    const schema = l.inputSchema as { required?: string[]; properties?: Record<string, { type?: string }> };
    return Object.fromEntries((schema.required ?? []).map((k) => [k, schema.properties?.[k]?.type === "number" ? 1 : "https://example.com/x"]));
  };
  const ids: string[] = [];

  try {
    // 1. Twenty anonymous self-serve keys: zero free calls.
    for (let i = 0; i < 20; i++) {
      const { api_key } = await registerSelfServeOperator();
      let r;
      try { r = await createOrder(api_key, cheap.id, input(cheap)); } catch (e) { r = { error: String(e) } as never; }
      assert.ok(!("free_trial" in r), `anonymous key #${i} got a free call`);
      assert.ok("invoice" in r && r.invoice, `anonymous key #${i} should get an invoice, got ${JSON.stringify(r)}`);
    }
    console.log("PASS 20 anonymous keys -> 0 free calls (all invoiced)");

    // 2. Unverified human account: no free call.
    const unverified = await humanOperator(`${TAG}-unverified@example.com`); ids.push(unverified.id);
    await db.operator.update({ where: { id: unverified.id }, data: { trialCallsRemaining: 1 } }); // even if a trial were somehow set
    const r2 = await createOrder(unverified.apiKey, cheap.id, input(cheap));
    assert.ok(!("free_trial" in r2), "unverified account got a free call");
    console.log("PASS unverified account -> no free call even with trial counter set");

    // 3. Verified human account: one free call, then invoices.
    const a = await humanOperator(`${TAG}.Alice+one@gmail.com`); ids.push(a.id);
    const v = await verifyNow(a.id);
    assert.deepEqual(v.result, { status: "verified", trialGranted: true });
    const reuse = await verifyEmailToken(v.token);
    assert.notEqual(reuse.status, "verified", "token must be single-use");
    const free = await createOrder(a.apiKey, cheap.id, input(cheap));
    assert.ok("free_trial" in free && free.free_trial === true, "verified account should get its free call");
    const second = await createOrder(a.apiKey, cheap.id, input(cheap));
    assert.ok(!("free_trial" in second), "second call must not be free");
    console.log("PASS verified account -> exactly one free call");

    // 4. Alias of the same address cannot claim again (dots / +tag / googlemail).
    // normalizeEmail collapses dots and +tags for gmail, so these are the same inbox.
    const b = await humanOperator(`${TAG.replace(/-/g, "")}x@gmail.com`); ids.push(b.id);
    const c = await humanOperator(`${TAG.replace(/-/g, "")}.x+spam@gmail.com`); ids.push(c.id);
    assert.equal((await verifyNow(b.id)).result.status, "verified");
    const vc = await verifyNow(c.id);
    assert.deepEqual(vc.result, { status: "verified", trialGranted: false });
    const rc = await createOrder(c.apiKey, cheap.id, input(cheap));
    assert.ok(!("free_trial" in rc), "alias account got a second free call");
    console.log("PASS alias of an already-claimed address -> verified but no trial");

    // 5. Concurrent confirmation clicks grant at most one trial.
    const d = await humanOperator(`${TAG}-race@example.com`); ids.push(d.id);
    const token = randomBytes(32).toString("hex");
    await db.emailVerificationToken.create({ data: { operatorId: d.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 3600_000) } });
    const results = await Promise.all(Array.from({ length: 8 }, () => verifyEmailToken(token)));
    const granted = results.filter((r) => r.status === "verified" && r.trialGranted).length;
    assert.equal(granted, 1, `expected exactly 1 trial grant, got ${granted}`);
    assert.equal((await db.operator.findUniqueOrThrow({ where: { id: d.id } })).trialCallsRemaining, 1);
    console.log("PASS 8 concurrent confirmations -> exactly one trial granted");

    // 6. Price cap: a verified account's trial does not cover an expensive listing.
    const e = await humanOperator(`${TAG}-cap@example.com`); ids.push(e.id);
    await verifyNow(e.id);
    const capped = await createOrder(e.apiKey, pricey.id, input(pricey));
    assert.ok(!("free_trial" in capped), "trial must not cover a listing above the price cap");
    assert.equal((await db.operator.findUniqueOrThrow({ where: { id: e.id } })).trialCallsRemaining, 1, "trial must be preserved");
    console.log(`PASS listing above the cap (${pricey.priceSats} sats) -> invoiced, trial preserved`);

    // 7. Disposable-domain accounts verify but never get a trial.
    const f = await humanOperator(`${TAG}@mailinator.com`); ids.push(f.id);
    assert.deepEqual((await verifyNow(f.id)).result, { status: "verified", trialGranted: false });
    console.log("PASS disposable domain -> no trial");

    console.log(`\nAll free-trial checks passed (${stubbedInvoices} stubbed invoices, 0 real).`);
  } finally {
    // Cleanup: every test operator (self-serve ones are recognizable by email) and its rows.
    const selfServe = await db.operator.findMany({ where: { email: { endsWith: "@example.invalid" }, createdAt: { gte: new Date(Date.now() - 3600_000) } }, select: { id: true } });
    const all = [...ids, ...selfServe.map((o) => o.id)];
    await db.order.deleteMany({ where: { buyerId: { in: all } } });
    await db.auditLogEntry.deleteMany({ where: { operatorId: { in: all } } });
    await db.trialClaim.deleteMany({ where: { operatorId: { in: all } } });
    await db.emailVerificationToken.deleteMany({ where: { operatorId: { in: all } } });
    await db.operator.deleteMany({ where: { id: { in: all } } });
    await db.$disconnect();
  }
}

main().catch((e) => { console.error("FAIL:", e); process.exit(1); });
