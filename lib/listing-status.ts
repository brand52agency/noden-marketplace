// Real-data status for a listing row: "new" until it has a verified trade,
// then "verified" or "watch" based on its actual success rate — never a
// fabricated state. Mirrors the honesty rule in lib/reputation.ts.
export type ListingStatusKey = "new" | "verified" | "watch";

export function getListingStatus(l: { verified_trades: number; success_rate: number | null }): {
  key: ListingStatusKey;
  label: string;
  className: string;
  dotClassName: string;
} {
  if (l.verified_trades === 0) {
    return { key: "new", label: "new", className: "text-ink-tertiary", dotClassName: "bg-ink-tertiary" };
  }
  if (l.success_rate !== null && l.success_rate >= 0.9) {
    return { key: "verified", label: "verified", className: "text-success", dotClassName: "bg-success" };
  }
  return { key: "watch", label: "watch", className: "text-fail", dotClassName: "bg-fail" };
}
