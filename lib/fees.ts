// Noden keeps a cut of every completed order. The buyer's payment lands in
// Noden's own wallet, so taking a fee is just paying a third-party seller less than the
// full order amount and letting the difference stay there. Noden is the only seller today,
// so in practice no payout happens and the whole amount is Noden's revenue.
export const PLATFORM_FEE_RATE = 0.025;

export function splitPayout(amountSats: number) {
  const platformFeeSats = Math.round(amountSats * PLATFORM_FEE_RATE);
  const sellerPayoutSats = amountSats - platformFeeSats;
  return { sellerPayoutSats, platformFeeSats };
}
