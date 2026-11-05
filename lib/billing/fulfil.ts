// Turns Stripe webhook events into ledger changes. Everything here is idempotent: Stripe retries and
// delivers events more than once, and the unique ledger `ref` makes a repeat a no-op.
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { clawBackCredits, grantCredits, once } from "@/lib/billing/ledger";
import { getSku } from "@/lib/billing/catalog";

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));

export type Outcome = "granted" | "duplicate" | "ignored" | "mismatch";

// checkout.session.completed / async_payment_succeeded: grant credits once Stripe says the money is in.
export async function fulfilCheckoutSession(session: Stripe.Checkout.Session): Promise<Outcome> {
  // The Stripe account is shared with other businesses (Brand52), so events for anything that isn't a
  // Noden purchase we started are ignored.
  if (session.metadata?.app !== "noden") return "ignored";
  let purchase = await db.purchase.findUnique({ where: { stripeSessionId: session.id } });
  if (!purchase) {
    // Our Purchase row is written right after the session is created; if that write was lost, rebuild it
    // from the SKU in the session metadata (credits and price still come from our catalog, not from Stripe).
    const sku = getSku(session.metadata?.sku ?? "");
    const operatorId = session.metadata?.operator_id;
    const operator = operatorId ? await db.operator.findUnique({ where: { id: operatorId }, select: { id: true } }) : null;
    if (!sku || !operator) return "ignored";
    purchase = await db.purchase.create({
      data: { operatorId: operator.id, sku: sku.id, credits: sku.credits, amountCents: sku.amountCents, stripeSessionId: session.id },
    });
  }
  if (session.payment_status !== "paid") return "ignored"; // async methods: wait for async_payment_succeeded

  // A test-mode payment moves no real money, so it must never produce spendable credits for a normal account.
  // Only admin accounts (the owner, testing) may receive credits from test-mode payments.
  if (session.livemode === false) {
    const buyer = await db.operator.findUnique({ where: { id: purchase.operatorId }, select: { role: true } });
    if (buyer?.role !== "admin") {
      await logAction(purchase.operatorId, "purchase", { billing: "test_mode_ignored", session: session.id });
      return "ignored";
    }
  }

  // Credits come from OUR row, and the amount Stripe charged (before tax) must match it.
  if (session.amount_subtotal !== purchase.amountCents || (session.currency ?? "usd") !== purchase.currency) {
    await logAction(purchase.operatorId, "purchase", {
      billing: "amount_mismatch",
      session: session.id,
      expectedCents: purchase.amountCents,
      gotCents: session.amount_subtotal,
    });
    console.error(`stripe session ${session.id}: amount mismatch (expected ${purchase.amountCents}, got ${session.amount_subtotal})`);
    return "mismatch";
  }

  const paymentIntent = idOf(session.payment_intent);
  const customer = idOf(session.customer);
  const applied = await once(async (tx) => {
    await grantCredits(tx, purchase.operatorId, purchase.credits, "purchase", `purchase:${session.id}`, `${purchase.sku} (${purchase.credits} credits)`);
    await tx.purchase.update({ where: { id: purchase.id }, data: { status: "paid", paidAt: new Date(), stripePaymentIntentId: paymentIntent } });
    if (customer) {
      // Only remember a customer id that isn't already attached to someone else.
      const taken = await tx.operator.findUnique({ where: { stripeCustomerId: customer }, select: { id: true } });
      if (!taken) await tx.operator.update({ where: { id: purchase.operatorId }, data: { stripeCustomerId: customer } });
    }
  });
  if (!applied) return "duplicate";
  await logAction(purchase.operatorId, "purchase", { billing: "credits_purchased", sku: purchase.sku, credits: purchase.credits, session: session.id });
  return "granted";
}

export async function expireCheckoutSession(session: Stripe.Checkout.Session) {
  await db.purchase.updateMany({ where: { stripeSessionId: session.id, status: "pending" }, data: { status: "expired" } });
}

// charge.refunded: take back credits in proportion to the amount refunded (a partial refund takes a partial amount).
export async function handleRefund(charge: Stripe.Charge): Promise<Outcome> {
  const paymentIntent = idOf(charge.payment_intent);
  if (!paymentIntent) return "ignored";
  const purchase = await db.purchase.findUnique({ where: { stripePaymentIntentId: paymentIntent } });
  if (!purchase || charge.amount <= 0) return "ignored";

  const shouldBeBack = Math.min(purchase.credits, Math.round((purchase.credits * charge.amount_refunded) / charge.amount));
  const toClaw = shouldBeBack - purchase.creditsClawedBack;
  if (toClaw <= 0) return "duplicate";

  const applied = await once(async (tx) => {
    await clawBackCredits(tx, purchase.operatorId, toClaw, `clawback:${charge.id}:${charge.amount_refunded}`, `refund of ${purchase.sku}`);
    await tx.purchase.update({
      where: { id: purchase.id },
      data: { creditsClawedBack: { increment: toClaw }, status: shouldBeBack >= purchase.credits ? "refunded" : purchase.status },
    });
  });
  if (!applied) return "duplicate";
  await logAction(purchase.operatorId, "purchase", { billing: "refund_clawback", credits: toClaw, charge: charge.id });
  return "granted";
}

// charge.dispute.created: take back everything not yet taken back and freeze credit use until an admin clears it.
export async function handleDispute(dispute: Stripe.Dispute): Promise<Outcome> {
  const paymentIntent = idOf(dispute.payment_intent);
  if (!paymentIntent) return "ignored";
  const purchase = await db.purchase.findUnique({ where: { stripePaymentIntentId: paymentIntent } });
  if (!purchase) return "ignored";

  const toClaw = purchase.credits - purchase.creditsClawedBack;
  const applied = await once(async (tx) => {
    if (toClaw > 0) await clawBackCredits(tx, purchase.operatorId, toClaw, `clawback:dispute:${dispute.id}`, `dispute on ${purchase.sku}`);
    await tx.purchase.update({ where: { id: purchase.id }, data: { creditsClawedBack: { increment: Math.max(0, toClaw) }, status: "disputed" } });
    await tx.operator.update({ where: { id: purchase.operatorId }, data: { billingHoldAt: new Date() } });
  });
  if (!applied) return "duplicate";
  await logAction(purchase.operatorId, "purchase", { billing: "dispute", credits: toClaw, dispute: dispute.id });
  return "granted";
}
