// Fresh listings start at the Prisma schema defaults (reputation: 5.0,
// successRate: 1.0) simply because they've never been ordered — not
// because they've earned a perfect record. Presenting that default as a
// real score is misleading to any agent or registry deciding who to
// trust, so anything showing reputation to a caller should route through
// this instead of reading the raw columns directly.
export const COMPLETED_ORDER_STATUSES = ["settled", "disputed", "refunded"] as const;

export function describeReputation(
  listing: { reputation: number; successRate: number },
  verifiedTrades: number
) {
  if (verifiedTrades === 0) {
    return {
      reputation: null as number | null,
      success_rate: null as number | null,
      verified_trades: 0,
      reputation_status: "unrated — no verified trades yet",
    };
  }
  return {
    reputation: listing.reputation,
    success_rate: listing.successRate,
    verified_trades: verifiedTrades,
    reputation_status: `${verifiedTrades} verified trade${verifiedTrades === 1 ? "" : "s"}`,
  };
}
