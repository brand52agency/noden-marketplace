// What the public order endpoint and the MCP check_order_status tool may reveal.
//
// Anyone holding an order_id can read it (the id is the access token), so the response is an
// explicit whitelist. It must never be built by returning a database row: the order row joins the
// seller and listing records, which hold the seller's API key and password hash, payout details
// and the listing's prompt.
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
  listing?: { id: string; name: string; category: string } | null;
};

export function presentOrder(order: OrderRow) {
  const isFree = order.amountSats === 0;
  return {
    id: order.id,
    status: order.status,
    amountSats: order.amountSats,
    listingId: order.listingId,
    listing: order.listing ? { id: order.listing.id, name: order.listing.name, category: order.listing.category } : undefined,
    input: order.input,
    output: order.output,
    verificationResult: order.verificationResult,
    failureNote: order.failureNote,
    // The invoice is only useful while someone still needs to pay it.
    invoice: !isFree && order.status === "pending_payment" ? order.railInvoiceRef : undefined,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    settledAt: order.settledAt,
  };
}
