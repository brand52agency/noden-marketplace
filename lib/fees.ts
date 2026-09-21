// Noden keeps a cut of every settled order. Funds already land in
// Noden's own LNbits wallet when the buyer pays (escrow) — taking a fee
// is just paying the seller less than the full order amount and letting
// the difference sit in that same wallet, no separate transfer needed.
export const PLATFORM_FEE_RATE = 0.025;

export function splitPayout(amountSats: number) {
  const platformFeeSats = Math.round(amountSats * PLATFORM_FEE_RATE);
  const sellerPayoutSats = amountSats - platformFeeSats;
  return { sellerPayoutSats, platformFeeSats };
}
