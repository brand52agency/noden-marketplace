import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { paymentRail } from "@/lib/payments";
import { requestWalletPayment } from "@/lib/payments/nwc";
import { verifyAgainstSchema } from "@/lib/verify";
import { fulfillWithUsage, type FulfillmentUsage } from "@/lib/fulfillment";
import { logAction } from "@/lib/audit";
import { splitPayout } from "@/lib/fees";
import { generateApiKey } from "@/lib/api-key";
import { REAL_COMPLETED_WHERE } from "@/lib/reputation";
import { inputTooLarge } from "@/lib/credits";
import { RETRY_HASH_PREFIX, TRIAL_HASH_PREFIX, isCompleted, isFreeHash, isPending } from "@/lib/order-status";

export class MarketplaceError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function isNewUtcDay(spendResetAt: Date): boolean {
  const now = new Date();
  return (
    now.getUTCFullYear() !== spendResetAt.getUTCFullYear() ||
    now.getUTCMonth() !== spendResetAt.getUTCMonth() ||
    now.getUTCDate() !== spendResetAt.getUTCDate()
  );
}

export async function getOperatorByApiKey(apiKey: string) {
  const operator = await db.operator.findUnique({ where: { apiKey } });
  if (!operator) {
    throw new MarketplaceError(
      "invalid API key — you don't have access yet. Ask your operator to sign up at https://shop.getnoden.com/signup and give you a valid key.",
      401
    );
  }

  if (isNewUtcDay(operator.spendResetAt)) {
    return db.operator.update({
      where: { id: operator.id },
      data: { spendUsedTodaySats: 0, spendResetAt: new Date() },
    });
  }
  return operator;
}

const FREE_TRIAL_DAILY_LIMIT = Number(process.env.FREE_TRIAL_DAILY_LIMIT ?? 50);
// The trial only covers cheap listings, so a free call never costs Noden much.
const FREE_TRIAL_MAX_PRICE_SATS = Number(process.env.FREE_TRIAL_MAX_PRICE_SATS ?? 150);
// Kill switch: set FREE_TRIAL_ENABLED=false to stop all free calls immediately.
const FREE_TRIAL_ENABLED = process.env.FREE_TRIAL_ENABLED !== "false";

// One free purchase belongs to a *verified account* (one per normalized email,
// enforced by TrialClaim in lib/verification.ts) — never to an API key. Keys
// created anonymously via POST /api/v1/operators have no trial at all. Noden
// eats the (Haiku) cost, so it's bounded: verified owner, cheap listing, and a
// global daily cap on trial orders. Anything else gets the normal invoice flow.
async function claimFreeTrial(
  operator: { id: string; emailVerifiedAt: Date | null },
  listing: { priceSats: number }
): Promise<boolean> {
  if (!FREE_TRIAL_ENABLED) return false;
  if (!operator.emailVerifiedAt) return false;
  if (listing.priceSats > FREE_TRIAL_MAX_PRICE_SATS) return false;
  const operatorId = operator.id;
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const usedToday = await db.order.count({
    where: { amountSats: 0, railPaymentHash: { startsWith: TRIAL_HASH_PREFIX }, createdAt: { gte: startOfDay } },
  });
  if (usedToday >= FREE_TRIAL_DAILY_LIMIT) return false;
  const claimed = await db.operator.updateMany({
    where: { id: operatorId, trialCallsRemaining: { gt: 0 } },
    data: { trialCallsRemaining: { decrement: 1 } },
  });
  return claimed.count === 1;
}

export async function createOrder(
  apiKey: string,
  listingId: string,
  input: Record<string, unknown>,
  agentWalletConnection?: string,
  retryToken?: string
) {
  const operator = await getOperatorByApiKey(apiKey);

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || !listing.active) {
    throw new MarketplaceError("unknown or inactive listing_id", 404);
  }

  if (!operator.allowAllSellers) {
    const allowed = await db.sellerAllowlistEntry.findUnique({
      where: { operatorId_sellerId: { operatorId: operator.id, sellerId: listing.sellerId } },
    });
    if (!allowed) {
      throw new MarketplaceError(
        "you don't have access to this seller yet — ask your operator to add it to your allowlist (or enable allowAllSellers) at https://shop.getnoden.com/operator/setup",
        403
      );
    }
  }

  const inputCheck = verifyAgainstSchema(input, listing.inputSchema as object);
  if (!inputCheck.valid) {
    throw new MarketplaceError(`input does not match listing schema: ${inputCheck.errors}`, 422);
  }

  // Bounds what one call can cost Noden (see lib/credits.ts): many listings accept unbounded
  // arrays, so without this a single order could send ~200K tokens to the model.
  const tooLarge = inputTooLarge(input);
  if (tooLarge) throw new MarketplaceError(tooLarge, 413);

  // Redeeming a retry token: one free call of the same listing after a failed check.
  if (retryToken) return redeemRetryToken(operator, listing, input, retryToken);

  if (await claimFreeTrial(operator, listing)) {
    let trialOrder;
    try {
      trialOrder = await db.order.create({
        data: {
          buyerId: operator.id,
          sellerId: listing.sellerId,
          listingId: listing.id,
          input: input as Prisma.InputJsonValue,
          amountSats: 0,
          railInvoiceRef: "free-trial",
          railPaymentHash: `${TRIAL_HASH_PREFIX}${randomBytes(16).toString("hex")}`,
          status: "pending",
        },
      });
    } catch (err) {
      await db.operator.update({ where: { id: operator.id }, data: { trialCallsRemaining: { increment: 1 } } });
      throw err;
    }
    await logAction(operator.id, "purchase", { orderId: trialOrder.id, listingId: listing.id, amountSats: 0, freeTrial: true });
    return {
      order_id: trialOrder.id,
      amount_sats: 0,
      free_trial: true as const,
      invoice: null,
      message:
        "Free first call for your verified account — no payment needed. Poll GET /api/v1/orders/{order_id} (or the check_order_status tool); " +
        "the result runs on your first poll. Later purchases are paid over Lightning.",
    };
  }

  if (operator.spendCapDailySats <= 0) {
    throw new MarketplaceError(
      "you don't have access yet — no spend cap is set. Ask your operator to configure one at https://shop.getnoden.com/operator/setup",
      403
    );
  }
  if (operator.spendUsedTodaySats + listing.priceSats > operator.spendCapDailySats) {
    throw new MarketplaceError(
      `purchase would exceed today's spend cap (${operator.spendUsedTodaySats}/${operator.spendCapDailySats} sats used)`,
      403
    );
  }

  let paymentRequest;
  try {
    paymentRequest = await paymentRail.createPaymentRequest(listing.priceSats, {
      memo: `Noden: ${listing.name}`,
    });
  } catch (err) {
    throw new MarketplaceError(err instanceof Error ? err.message : "payment rail error", 503);
  }

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        buyerId: operator.id,
        sellerId: listing.sellerId,
        listingId: listing.id,
        input: input as Prisma.InputJsonValue,
        amountSats: listing.priceSats,
        railInvoiceRef: paymentRequest.railInvoiceRef,
        railPaymentHash: paymentRequest.id,
        status: "pending",
      },
    });
    await tx.operator.update({
      where: { id: operator.id },
      data: { spendUsedTodaySats: { increment: listing.priceSats } },
    });
    return created;
  });

  await logAction(operator.id, "purchase", { orderId: order.id, listingId: listing.id, amountSats: listing.priceSats });

  // Optional: actively ask the caller's own NWC wallet to pay the invoice
  // we just generated, instead of leaving that to some other channel.
  // Best-effort only — see lib/payments/nwc.ts for why this never affects
  // whether the order is actually considered paid.
  let walletPaymentRequested: boolean | undefined;
  let walletPaymentError: string | undefined;
  if (agentWalletConnection) {
    const result = await requestWalletPayment(agentWalletConnection, paymentRequest.railInvoiceRef);
    walletPaymentRequested = result.sent;
    if (!result.sent) walletPaymentError = result.error;
  }

  return {
    order_id: order.id,
    amount_sats: listing.priceSats,
    invoice: paymentRequest.railInvoiceRef,
    expires_at: paymentRequest.expiresAt,
    ...(walletPaymentRequested !== undefined && { wallet_payment_requested: walletPaymentRequested }),
    ...(walletPaymentError && { wallet_payment_error: walletPaymentError }),
  };
}

// A failed check never returns sats: it earns a single-use retry token instead. The token is good
// for one free call of the same listing, for 24 hours. A retry that fails again earns another
// token, but only MAX_RETRIES_PER_PAYMENT times per original payment, so a deliberately failing
// input cannot become unlimited free compute (see docs/credit-pricing.md).
const RETRY_TOKEN_TTL_HOURS = 24;
export const MAX_RETRIES_PER_PAYMENT = 2;

export async function issueRetryToken(orderId: string): Promise<string | null> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.retryDepth >= MAX_RETRIES_PER_PAYMENT) return null;
  if (order.retryToken && !order.retryTokenUsedAt) return order.retryToken; // already issued, still unused
  const token = `rt_${randomBytes(24).toString("hex")}`;
  await db.order.update({
    where: { id: orderId },
    data: {
      retryToken: token,
      retryTokenUsedAt: null,
      retryTokenExpiresAt: new Date(Date.now() + RETRY_TOKEN_TTL_HOURS * 3600 * 1000),
    },
  });
  return token;
}

async function redeemRetryToken(
  operator: { id: string },
  listing: { id: string; sellerId: string },
  input: Record<string, unknown>,
  token: string
) {
  const parent = await db.order.findUnique({ where: { retryToken: token } });
  // Same message for unknown, someone else's, or wrong-listing tokens: don't confirm a token exists.
  if (!parent || parent.buyerId !== operator.id || parent.listingId !== listing.id) {
    throw new MarketplaceError("invalid retry_token for this listing and API key", 403);
  }
  if (parent.retryTokenUsedAt) throw new MarketplaceError("this retry_token has already been used", 409);
  if (!parent.retryTokenExpiresAt || parent.retryTokenExpiresAt < new Date()) {
    throw new MarketplaceError("this retry_token has expired (tokens last 24 hours)", 410);
  }
  // Claim the token atomically so two simultaneous requests can't both use it.
  const claimed = await db.order.updateMany({
    where: { id: parent.id, retryTokenUsedAt: null },
    data: { retryTokenUsedAt: new Date() },
  });
  if (claimed.count !== 1) throw new MarketplaceError("this retry_token has already been used", 409);

  let retryOrder;
  try {
    retryOrder = await db.order.create({
      data: {
        buyerId: operator.id,
        sellerId: listing.sellerId,
        listingId: listing.id,
        input: input as Prisma.InputJsonValue,
        amountSats: 0,
        railInvoiceRef: "free-retry",
        railPaymentHash: `${RETRY_HASH_PREFIX}${randomBytes(16).toString("hex")}`,
        status: "pending",
        retryOfOrderId: parent.id,
        retryDepth: parent.retryDepth + 1,
      },
    });
  } catch (err) {
    await db.order.update({ where: { id: parent.id }, data: { retryTokenUsedAt: null } });
    throw err;
  }
  await logAction(operator.id, "retry", { orderId: retryOrder.id, retryOf: parent.id, listingId: listing.id });
  return {
    order_id: retryOrder.id,
    amount_sats: 0,
    free_retry: true as const,
    invoice: null,
    message:
      "Free retry — no payment needed. Poll GET /api/v1/orders/{order_id} (or the check_order_status tool); " +
      "the result runs on your first poll.",
  };
}

export async function getOrderStatus(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { listing: true, seller: true } });
  if (!order) throw new MarketplaceError("unknown order_id", 404);

  if (!isPending(order.status)) {
    return order;
  }

  const isFree = isFreeHash(order.railPaymentHash);
  const payStatus = isFree ? "paid" : await paymentRail.checkStatus(order.railPaymentHash);
  if (payStatus !== "paid") {
    return order;
  }

  // Payment confirmed (or a free call): run the skill and check the result automatically, no
  // separate agent call needed (build spec §5).
  let output: Record<string, unknown>;
  let verification: ReturnType<typeof verifyAgainstSchema>;
  let usage: FulfillmentUsage | null = null;
  try {
    const fulfilled = await fulfillWithUsage(order.listing, order.input as Record<string, unknown>);
    output = fulfilled.output;
    usage = fulfilled.usage;
    verification = verifyAgainstSchema(output, order.listing.outputSchema as object);
  } catch (err) {
    output = { error: err instanceof Error ? err.message : "fulfillment failed" };
    verification = { valid: false, errors: output.error as string };
  }

  // What this call actually cost Noden, next to what the buyer paid. Compare with the estimate in
  // docs/credit-pricing.md (query these entries to audit margins). A logging failure never affects the order.
  if (usage) {
    await logAction(order.buyerId, "fulfillment_cost", {
      orderId: order.id,
      listingId: order.listingId,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      costUsd: Number(usage.costUsd.toFixed(6)),
      priceSats: order.amountSats,
      freeCall: isFree,
    }).catch((err) => console.error("fulfillment_cost log failed:", err));
  }

  await logAction(order.buyerId, "verification", { orderId: order.id, pass: verification.valid });

  if (verification.valid) {
    const payoutDestination = isFree ? null : (order.seller.payoutLightningAddress ?? order.seller.nwcConnection);
    // With no external payout destination — true today, since Noden is the only seller and hasn't
    // registered a payout address for itself — the full amount stays in Noden's own wallet, so all
    // of it is platform revenue. The 2.5% split only applies once there's a third-party seller.
    let platformFeeSats = order.amountSats;
    if (payoutDestination) {
      const split = splitPayout(order.amountSats);
      platformFeeSats = split.platformFeeSats;
      try {
        await paymentRail.payOut(payoutDestination, split.sellerPayoutSats, `Payout for order ${order.id}`);
        await logAction(order.sellerId, "payout", { orderId: order.id, amountSats: split.sellerPayoutSats, platformFeeSats });
      } catch (err) {
        // A payout failure must not hide the buyer's verified output; it surfaces in /admin.
        console.error(`payout failed for order ${order.id}:`, err);
      }
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        status: "completed",
        output: output as Prisma.InputJsonValue,
        verificationResult: "pass",
        platformFeeSats,
        paidAt: new Date(),
        settledAt: new Date(),
      },
      include: { listing: true, seller: true },
    });
    await recalcReputation(order.listingId);
    return updated;
  }

  // Failed check: no sats go back. The caller gets a retry token (see issueRetryToken).
  await logAction(order.buyerId, "failure", { orderId: order.id, reason: verification.errors });
  await db.order.update({
    where: { id: order.id },
    data: {
      status: "failed",
      output: output as Prisma.InputJsonValue,
      verificationResult: "fail",
      failureNote: verification.errors,
      paidAt: new Date(),
    },
  });
  await issueRetryToken(order.id);
  return db.order.findUniqueOrThrow({ where: { id: order.id }, include: { listing: true, seller: true } });
}

// Default and hard-cap spend limits for an agent that self-registers with
// no human ever visiting /signup. Kept deliberately small — a human can
// always log in with the generated (unrecoverable, throwaway) credentials
// later and raise it, or the agent can pass a lower cap of its own choosing.
const SELF_SERVE_DEFAULT_SPEND_CAP_SATS = 1000;
const SELF_SERVE_MAX_SPEND_CAP_SATS = 5000;

export async function registerSelfServeOperator(requestedSpendCapSats?: number) {
  const spendCapDailySats = Math.max(
    1,
    Math.min(requestedSpendCapSats ?? SELF_SERVE_DEFAULT_SPEND_CAP_SATS, SELF_SERVE_MAX_SPEND_CAP_SATS)
  );

  const email = `agent-${randomBytes(8).toString("hex")}@example.invalid`;
  // Nobody is ever meant to log in with this — it's a random, discarded
  // password, not a secret the agent needs. The API key is the credential.
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const apiKey = generateApiKey();

  const operator = await db.operator.create({
    data: {
      email,
      passwordHash,
      role: "buyer",
      name: "Self-serve agent",
      allowAllSellers: true,
      spendCapDailySats,
      apiKey,
    },
  });

  return {
    api_key: operator.apiKey,
    spend_cap_daily_sats: operator.spendCapDailySats,
    free_first_call: false,
    note:
      "Purchases with this key are paid over Lightning: POST /api/v1/orders returns an invoice (HTTP 402) and the skill runs once it is paid. " +
      "The free first call belongs to a verified human account, not to a key — sign up and confirm your email at https://shop.getnoden.com/signup to get it. " +
      "This key is self-issued and isn't tied to any human-owned account — there's no login for it, so save it now, it won't " +
      `be shown again. Its spend cap is fixed at creation (max ${SELF_SERVE_MAX_SPEND_CAP_SATS} sats/day for a self-serve key) ` +
      "and can't be raised later. For a higher cap or ongoing review/monitoring, a human should sign up their own operator " +
      "account instead at https://shop.getnoden.com/signup.",
  };
}

async function recalcReputation(listingId: string) {
  const orders = await db.order.findMany({ where: { listingId, ...REAL_COMPLETED_WHERE } });
  if (orders.length === 0) return;
  const settled = orders.filter((o) => isCompleted(o.status)).length;
  const successRate = settled / orders.length;
  const disputeRate = orders.filter((o) => !isCompleted(o.status)).length / orders.length;
  const reputation = Math.max(1, Math.min(5, 5 * successRate - disputeRate * 2));
  await db.listing.update({ where: { id: listingId }, data: { successRate, reputation } });
}
