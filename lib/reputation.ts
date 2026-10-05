// Fresh listings start at the Prisma schema defaults (reputation: 5.0,
// successRate: 1.0) simply because they've never been ordered — not
// because they've earned a perfect record. Presenting that default as a
// real score is misleading to any agent or registry deciding who to
// trust, so anything showing reputation to a caller should route through
// this instead of reading the raw columns directly.
export const COMPLETED_ORDER_STATUSES = ["settled", "disputed", "refunded"] as const;

// Orders from seeded demo buyers, internal test operators, and the registry
// protocol-test operator are real rows (admin still sees them) but must never
// feed public trust numbers. amountSats > 0 also excludes free-trial orders,
// which can't be paid for and so shouldn't be farmable into a reputation.
export const DEMO_BUYER_WHERE = {
  OR: [
    { email: { endsWith: "@agentixshop.dev" } },
    { email: { endsWith: "@noden.internal" } },
    { email: { startsWith: "mcp-protocol-test-" } },
  ],
};
export const REAL_ORDER_WHERE = { NOT: { buyer: DEMO_BUYER_WHERE }, amountSats: { gt: 0 } };
export const REAL_COMPLETED_WHERE = { ...REAL_ORDER_WHERE, status: { in: [...COMPLETED_ORDER_STATUSES] } };

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
