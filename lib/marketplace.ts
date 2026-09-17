import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { paymentRail } from "@/lib/payments";
import { verifyAgainstSchema } from "@/lib/verify";
import { fulfill } from "@/lib/fulfillment";
import { logAction } from "@/lib/audit";
import { splitPayout } from "@/lib/fees";

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
  if (!operator) throw new MarketplaceError("invalid API key", 401);

  if (isNewUtcDay(operator.spendResetAt)) {
    return db.operator.update({
      where: { id: operator.id },
      data: { spendUsedTodaySats: 0, spendResetAt: new Date() },
    });
  }
  return operator;
}

export async function createOrder(apiKey: string, listingId: string, input: Record<string, unknown>) {
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
      throw new MarketplaceError("this seller is not on your allowlist", 403);
    }
  }

  if (operator.spendCapDailySats <= 0) {
    throw new MarketplaceError("spend cap is not set — configure one at /operator/setup", 403);
  }
  if (operator.spendUsedTodaySats + listing.priceSats > operator.spendCapDailySats) {
    throw new MarketplaceError(
      `purchase would exceed today's spend cap (${operator.spendUsedTodaySats}/${operator.spendCapDailySats} sats used)`,
      403
    );
  }

  const inputCheck = verifyAgainstSchema(input, listing.inputSchema as object);
  if (!inputCheck.valid) {
    throw new MarketplaceError(`input does not match listing schema: ${inputCheck.errors}`, 422);
  }

  let paymentRequest;
  try {
    paymentRequest = await paymentRail.createPaymentRequest(listing.priceSats, {
      memo: `Agentix: ${listing.name}`,
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
        status: "pending_payment",
      },
    });
    await tx.operator.update({
      where: { id: operator.id },
      data: { spendUsedTodaySats: { increment: listing.priceSats } },
    });
    return created;
  });

  await logAction(operator.id, "purchase", { orderId: order.id, listingId: listing.id, amountSats: listing.priceSats });

  return {
    order_id: order.id,
    amount_sats: listing.priceSats,
    invoice: paymentRequest.railInvoiceRef,
    expires_at: paymentRequest.expiresAt,
  };
}

const REFUND_GRACE_WINDOW_MINUTES = Number(process.env.REFUND_GRACE_WINDOW_MINUTES ?? 0);

export async function getOrderStatus(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { listing: true, seller: true } });
  if (!order) throw new MarketplaceError("unknown order_id", 404);

  if (order.status !== "pending_payment") {
    return order;
  }

  const payStatus = await paymentRail.checkStatus(order.railPaymentHash);
  if (payStatus !== "paid") {
    return order;
  }

  // Payment confirmed — trigger fulfillment + verification automatically,
  // no separate agent call needed (build spec §5).
  let output: Record<string, unknown>;
  let verification: ReturnType<typeof verifyAgainstSchema>;
  try {
    output = await fulfill(order.listing, order.input as Record<string, unknown>);
    verification = verifyAgainstSchema(output, order.listing.outputSchema as object);
  } catch (err) {
    output = { error: err instanceof Error ? err.message : "fulfillment failed" };
    verification = { valid: false, errors: output.error as string };
  }

  await logAction(order.buyerId, "verification", { orderId: order.id, pass: verification.valid });

  if (verification.valid) {
    const payoutDestination = order.seller.payoutLightningAddress ?? order.seller.nwcConnection;
    // With no external payout destination — true today, since Agentix is the
    // only seller and hasn't registered a payout address for itself — the
    // full amount simply stays in Agentix's own LNbits wallet, so all of it
    // is platform revenue. The 2.5% split only applies once there's an
    // actual third-party seller to pay the rest out to.
    let platformFeeSats = order.amountSats;
    if (payoutDestination) {
      const split = splitPayout(order.amountSats);
      platformFeeSats = split.platformFeeSats;
      try {
        await paymentRail.payOut(payoutDestination, split.sellerPayoutSats, `Payout for order ${order.id}`);
        await logAction(order.sellerId, "payout", { orderId: order.id, amountSats: split.sellerPayoutSats, platformFeeSats });
      } catch (err) {
        // Payout failure shouldn't block the buyer from seeing their
        // verified output — surfaces in /admin for manual payout retry.
        console.error(`payout failed for order ${order.id}:`, err);
      }
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        status: "settled",
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

  await logAction(order.buyerId, "dispute", { orderId: order.id, reason: verification.errors });

  if (REFUND_GRACE_WINDOW_MINUTES <= 0) {
    await refundOrder(order.id);
  }

  return db.order.update({
    where: { id: order.id },
    data: {
      status: "disputed",
      output: output as Prisma.InputJsonValue,
      verificationResult: "fail",
      failureNote: verification.errors,
      paidAt: new Date(),
    },
    include: { listing: true, seller: true },
  });
}

export async function refundOrder(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { buyer: true } });
  if (!order) throw new MarketplaceError("unknown order_id", 404);

  const refundDestination = order.buyer.nwcConnection ?? order.buyer.payoutLightningAddress;
  if (refundDestination) {
    await paymentRail.payOut(refundDestination, order.amountSats, `Refund for order ${order.id}`);
  }
  await db.operator.update({
    where: { id: order.buyerId },
    data: { spendUsedTodaySats: { decrement: order.amountSats } },
  });
  return db.order.update({ where: { id: order.id }, data: { status: "refunded" } });
}

async function recalcReputation(listingId: string) {
  const orders = await db.order.findMany({ where: { listingId, status: { in: ["settled", "disputed", "refunded"] } } });
  if (orders.length === 0) return;
  const settled = orders.filter((o) => o.status === "settled").length;
  const successRate = settled / orders.length;
  const disputeRate = orders.filter((o) => o.status !== "settled").length / orders.length;
  const reputation = Math.max(1, Math.min(5, 5 * successRate - disputeRate * 2));
  await db.listing.update({ where: { id: listingId }, data: { successRate, reputation } });
}
