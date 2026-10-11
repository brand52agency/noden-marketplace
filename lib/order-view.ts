// What the public order endpoint and the MCP check_order_status tool may reveal.
//
// Anyone holding an order_id can read it (the id is the access token), so the response is an
// explicit whitelist. It must never be built by returning a database row: the order row joins the
// seller and listing records, which hold the seller's API key and password hash, payout details
// and the listing's prompt.
import { isFreeHash, isPending, isFailed, normalizeOrderStatus } from "@/lib/order-status";

type OrderRow = {
  id: string;
  status: string;
  amountSats: number;
  listingId: string;
  input: unknown;
  output: unknown;
  verificationResult: string | null;
  failureNote: string | null;
  railInvoiceRef: string;
  railPaymentHash: string;
  createdAt: Date;
  paidAt: Date | null;
  settledAt: Date | null;
  retryToken?: string | null;
  retryTokenExpiresAt?: Date | null;
  retryTokenUsedAt?: Date | null;
  listing?: { id: string; name: string; category: string } | null;
};

export function presentOrder(order: OrderRow) {
  const failed = isFailed(order.status);
  const tokenLive =
    failed &&
    !!order.retryToken &&
    !order.retryTokenUsedAt &&
    !!order.retryTokenExpiresAt &&
    order.retryTokenExpiresAt > new Date();
  return {
    id: order.id,
    status: normalizeOrderStatus(order.status),
    amountSats: order.amountSats,
    listingId: order.listingId,
    listing: order.listing ? { id: order.listing.id, name: order.listing.name, category: order.listing.category } : undefined,
    input: order.input,
    // A result that failed its check is never handed back.
    output: failed ? undefined : order.output,
    verificationResult: order.verificationResult,
    failureNote: order.failureNote,
    // The invoice is only useful while someone still needs to pay it.
    invoice: isPending(order.status) && !isFreeHash(order.railPaymentHash) ? order.railInvoiceRef : undefined,
    // After a failed check: one free call of the same listing, for 24 hours.
    retryToken: tokenLive ? order.retryToken : undefined,
    retryTokenExpiresAt: tokenLive ? order.retryTokenExpiresAt : undefined,
    message: failed
      ? tokenLive
        ? "This result failed its check, so it was not returned. Send retry_token with POST /api/v1/orders (same listing, same API key) for one free call within 24 hours."
        : "This result failed its check, so it was not returned. No further free retries are available for this order."
      : undefined,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    settledAt: order.settledAt,
  };
}
