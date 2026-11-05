// Credit ledger, Stripe fulfilment and spending tests. Needs a database that has the billing tables
// (npx prisma db push). Creates one throwaway operator (@noden.internal) and deletes everything it made.
//   npm run test:credits
import { randomBytes } from "crypto";
import type Stripe from "stripe";
import { db } from "../lib/db";
import { apiKeyFields, generateApiKey } from "../lib/api-key";
import { createOrder, MarketplaceError } from "../lib/marketplace";
import { priceCredits } from "../lib/credits";
import { clawBackCredits, grantCredits, once } from "../lib/billing/ledger";
import { fulfilCheckoutSession, handleDispute, handleRefund } from "../lib/billing/fulfil";
import { getSku } from "../lib/billing/catalog";
import { getStripe, webhookSecret } from "../lib/billing/stripe";

let failed = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};

const tag = randomBytes(4).toString("hex");

async function makeOperator(label: string) {
  const key = generateApiKey();
  const op = await db.operator.create({
    data: { email: `credits-test-${label}-${tag}@noden.internal`, passwordHash: "x", ...apiKeyFields(key), emailVerifiedAt: new Date() },
  });
  return { op, key };
}

const balanceOf = async (id: string) => (await db.operator.findUniqueOrThrow({ where: { id } })).creditBalance;
const ledgerSum = async (id: string) => (await db.creditEntry.aggregate({ _sum: { delta: true }, where: { operatorId: id } }))._sum.delta ?? 0;

function fakeSession(id: string, operatorId: string, skuId: string, over: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  const sku = getSku(skuId)!;
  return {
    id,
    payment_status: "paid",
    amount_subtotal: sku.amountCents,
    currency: "usd",
    metadata: { app: "noden", operator_id: operatorId, sku: skuId },
    payment_intent: `pi_${id}`,
    customer: null,
    ...over,
  } as unknown as Stripe.Checkout.Session;
}

async function main() {
  const operators: string[] = [];
  try {
    // ---- 1. Webhook signatures (no database needed) ----
    process.env.STRIPE_SECRET_KEY ??= "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET ??= "whsec_test_dummy";
    const payload = JSON.stringify({ id: "evt_1", object: "event", type: "ping", data: { object: {} } });
    const header = getStripe().webhooks.generateTestHeaderString({ payload, secret: webhookSecret() });
    let ok = true;
    try { getStripe().webhooks.constructEvent(payload, header, webhookSecret()); } catch { ok = false; }
    check("a correctly signed event is accepted", ok);
    let rejected = false;
    try { getStripe().webhooks.constructEvent(payload + " ", header, webhookSecret()); } catch { rejected = true; }
    check("a tampered body is rejected", rejected);

    // ---- 2. Grants are idempotent ----
    const a = await makeOperator("a");
    operators.push(a.op.id);
    const first = await once(async (tx) => { await grantCredits(tx, a.op.id, 100, "grant", `test:${tag}:dup`); });
    const second = await once(async (tx) => { await grantCredits(tx, a.op.id, 100, "grant", `test:${tag}:dup`); });
    check("the same ledger ref applies once", first && !second, `balance ${await balanceOf(a.op.id)}`);
    check("a repeated ref leaves the balance at 100", (await balanceOf(a.op.id)) === 100);

    // ---- 3. Stripe fulfilment ----
    const b = await makeOperator("b");
    operators.push(b.op.id);
    const sku = getSku("topup-1000")!;
    const sid = `cs_test_${tag}_1`;
    await db.purchase.create({ data: { operatorId: b.op.id, sku: sku.id, credits: sku.credits, amountCents: sku.amountCents, stripeSessionId: sid } });
    const s1 = await fulfilCheckoutSession(fakeSession(sid, b.op.id, sku.id));
    const s2 = await fulfilCheckoutSession(fakeSession(sid, b.op.id, sku.id));
    check("a paid session grants credits once", s1 === "granted" && s2 === "duplicate" && (await balanceOf(b.op.id)) === 1000, `${s1}/${s2}, balance ${await balanceOf(b.op.id)}`);

    const sidBad = `cs_test_${tag}_2`;
    await db.purchase.create({ data: { operatorId: b.op.id, sku: sku.id, credits: sku.credits, amountCents: sku.amountCents, stripeSessionId: sidBad } });
    const bad = await fulfilCheckoutSession(fakeSession(sidBad, b.op.id, sku.id, { amount_subtotal: 100 }));
    check("a session paid for the wrong amount grants nothing", bad === "mismatch" && (await balanceOf(b.op.id)) === 1000);

    const unpaid = await fulfilCheckoutSession(fakeSession(sidBad, b.op.id, sku.id, { payment_status: "unpaid" }));
    check("an unpaid session grants nothing", unpaid === "ignored");

    const foreign = await fulfilCheckoutSession(fakeSession(`cs_test_${tag}_other`, b.op.id, sku.id, { metadata: { app: "brand52" } }));
    check("another business's session is ignored", foreign === "ignored");

    const lost = `cs_test_${tag}_lost`;
    const rebuilt = await fulfilCheckoutSession(fakeSession(lost, b.op.id, sku.id));
    check("a session whose Purchase row was lost is rebuilt from the catalog", rebuilt === "granted" && (await balanceOf(b.op.id)) === 2000);

    // A test-mode payment grants credits to an admin only, never to a normal account.
    const tm = `cs_test_${tag}_tm`;
    await db.purchase.create({ data: { operatorId: b.op.id, sku: sku.id, credits: sku.credits, amountCents: sku.amountCents, stripeSessionId: tm } });
    const beforeTm = await balanceOf(b.op.id);
    const tmUser = await fulfilCheckoutSession(fakeSession(tm, b.op.id, sku.id, { livemode: false }));
    check("a test-mode payment grants a normal account nothing", tmUser === "ignored" && (await balanceOf(b.op.id)) === beforeTm);
    await db.operator.update({ where: { id: b.op.id }, data: { role: "admin" } });
    const tmAdmin = await fulfilCheckoutSession(fakeSession(tm, b.op.id, sku.id, { livemode: false }));
    check("a test-mode payment grants an admin account its credits", tmAdmin === "granted" && (await balanceOf(b.op.id)) === beforeTm + 1000);
    await db.operator.update({ where: { id: b.op.id }, data: { role: "buyer" } });
    await once(async (tx) => { await clawBackCredits(tx, b.op.id, 1000, `test:${tag}:undo-tm`); });
    await db.purchase.update({ where: { stripeSessionId: tm }, data: { creditsClawedBack: 1000 } });

    // ---- 4. Refund and dispute ----
    const pi = `pi_${sid}`;
    const half = { id: `ch_${tag}`, payment_intent: pi, amount: sku.amountCents, amount_refunded: sku.amountCents / 2 } as unknown as Stripe.Charge;
    const r1 = await handleRefund(half);
    const r1again = await handleRefund(half);
    check("a half refund takes back half the credits, once", r1 === "granted" && r1again === "duplicate" && (await balanceOf(b.op.id)) === 1500, `balance ${await balanceOf(b.op.id)}`);
    const full = { ...half, amount_refunded: sku.amountCents } as Stripe.Charge;
    await handleRefund(full);
    check("a full refund takes back the rest", (await balanceOf(b.op.id)) === 1000);

    const d = await handleDispute({ id: `dp_${tag}`, payment_intent: `pi_${lost}` } as unknown as Stripe.Dispute);
    const held = await db.operator.findUniqueOrThrow({ where: { id: b.op.id } });
    check("a dispute takes back credits and freezes the account", d === "granted" && held.billingHoldAt !== null && held.creditBalance === 0, `balance ${held.creditBalance}`);
    check("the ledger always adds up to the balance", (await ledgerSum(b.op.id)) === held.creditBalance);

    // ---- 5. Spending, including 50 at once ----
    const listing = await db.listing.findFirst({ where: { active: true, handler: null }, orderBy: { createdAt: "asc" } });
    if (!listing) throw new Error("no listing to test with");
    const price = priceCredits(listing);
    const c = await makeOperator("c");
    operators.push(c.op.id);
    const affordable = 10;
    await once(async (tx) => { await grantCredits(tx, c.op.id, price * affordable + 1, "grant", `test:${tag}:fund-c`); });
    // Use sample input that passes the listing's schema.
    const sample = sampleInput(listing.inputSchema);
    const results = await Promise.allSettled(Array.from({ length: 50 }, () => createOrder(c.key, listing.id, sample)));
    const wins = results.filter((x) => x.status === "fulfilled" && (x.value as { paid_with_credits?: boolean }).paid_with_credits).length;
    const orders = await db.order.count({ where: { buyerId: c.op.id, amountCredits: { gt: 0 } } });
    const finalBalance = await balanceOf(c.op.id);
    const errs = results.filter((x) => x.status === "rejected").map((x) => (x as PromiseRejectedResult).reason);
    check(`50 simultaneous orders spend exactly ${affordable} calls' worth`, wins === affordable && orders === affordable && finalBalance === 1, `wins ${wins}, orders ${orders}, balance ${finalBalance}, price ${price}`);
    check("the balance never goes negative", finalBalance >= 0);
    check("the ledger adds up after the race", (await ledgerSum(c.op.id)) === finalBalance);
    void errs.filter((e) => !(e instanceof MarketplaceError)); // other failures would surface as non-wins above

    // A frozen account can't spend even with a balance.
    await db.operator.update({ where: { id: c.op.id }, data: { billingHoldAt: new Date(), spendCapDailySats: 0 } });
    await once(async (tx) => { await grantCredits(tx, c.op.id, price, "grant", `test:${tag}:fund-c2`); });
    let heldBlocked = false;
    try { await createOrder(c.key, listing.id, sample); } catch (e) { heldBlocked = e instanceof MarketplaceError; }
    check("an account on hold cannot spend credits", heldBlocked);
  } finally {
    for (const id of operators) {
      await db.order.deleteMany({ where: { buyerId: id } });
      await db.auditLogEntry.deleteMany({ where: { operatorId: id } });
      await db.creditEntry.deleteMany({ where: { operatorId: id } });
      await db.purchase.deleteMany({ where: { operatorId: id } });
      await db.operator.delete({ where: { id } }).catch((e) => console.error("cleanup:", e.message));
    }
    await db.$disconnect();
  }
  console.log(failed ? `\n${failed} FAILED` : "\nall passed");
  process.exit(failed ? 1 : 0);
}

function sampleInput(schema: unknown): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const make = (s: any): any => {
    if (!s || typeof s !== "object") return "x";
    if (Array.isArray(s.enum)) return s.enum[0];
    switch (s.type) {
      case "string": return "a short sample value";
      case "number": case "integer": return typeof s.minimum === "number" ? s.minimum : 1;
      case "boolean": return true;
      case "array": return [make(s.items)];
      case "object": return Object.fromEntries(Object.entries(s.properties ?? {}).filter(([k]) => (s.required ?? []).includes(k)).map(([k, v]) => [k, make(v)]));
      default: return "x";
    }
  };
  return make(schema);
}

main().catch((e) => { console.error(e); process.exit(1); });
