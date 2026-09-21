import Link from "next/link";
import SatsPrice from "@/components/SatsPrice";
import { StatusBadge } from "@/components/StatusBadge";

type TableListing = {
  id: string;
  name: string;
  category: string;
  priceSats: number;
  verified_trades: number;
  success_rate: number | null;
};

export function ListingsTable({
  listings,
  usdPerBtc,
  view,
}: {
  listings: TableListing[];
  usdPerBtc: number;
  view?: string;
}) {
  const suffix = view === "operator" ? "?view=operator" : "";

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div className="hidden grid-cols-[1fr_150px_130px_100px_120px] gap-4 border-b border-border bg-surface px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-tertiary sm:grid">
        <span>name</span>
        <span>category</span>
        <span>price</span>
        <span>trades</span>
        <span>status</span>
      </div>
      <div className="divide-y divide-border">
        {listings.map((l, i) => (
          <Link
            key={l.id}
            href={`/marketplace/${l.id}${suffix}`}
            style={{ animationDelay: `${Math.min(i, 14) * 25}ms` }}
            className="animate-fade-in-up grid grid-cols-2 items-center gap-2 bg-bg px-5 py-4 transition-colors hover:bg-surface sm:grid-cols-[1fr_150px_130px_100px_120px] sm:gap-4"
          >
            <span className="col-span-2 truncate text-sm font-medium text-ink sm:col-span-1">{l.name}</span>
            <span className="truncate text-xs text-ink-secondary">{l.category}</span>
            <SatsPrice sats={l.priceSats} usdPerBtc={usdPerBtc} className="font-mono text-xs text-accent" />
            <span className="font-mono text-xs text-ink-tertiary">
              {l.verified_trades > 0 ? `${l.verified_trades}×` : "—"}
            </span>
            <StatusBadge verifiedTrades={l.verified_trades} successRate={l.success_rate} />
          </Link>
        ))}
      </div>
    </div>
  );
}
