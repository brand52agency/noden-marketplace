import { getListingStatus } from "@/lib/listing-status";

export function StatusBadge({
  verifiedTrades,
  successRate,
}: {
  verifiedTrades: number;
  successRate: number | null;
}) {
  const status = getListingStatus({ verified_trades: verifiedTrades, success_rate: successRate });
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider ${status.className}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${status.dotClassName}`} />
      {status.label}
    </span>
  );
}
