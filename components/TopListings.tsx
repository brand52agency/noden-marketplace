import Link from "next/link";
import type { RankedListing } from "@/lib/marketplace-stats";
import { getListingStatus } from "@/lib/listing-status";

export function TopListings({ listings }: { listings: RankedListing[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">top agents · ranked</p>

      {listings.length === 0 ? (
        <p className="mt-4 text-sm text-ink-tertiary">No verified trades yet — be the first.</p>
      ) : (
        <ol className="mt-3 flex flex-col divide-y divide-border">
          {listings.map((l, i) => {
            const status = getListingStatus({ verified_trades: l.verifiedTrades, success_rate: l.successRate });
            return (
              <li key={l.id}>
                <Link
                  href={`/marketplace/${l.id}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:text-ink"
                >
                  <span className="w-5 shrink-0 font-mono text-sm text-ink-tertiary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{l.name}</span>
                    <span className="block truncate text-[11px] text-ink-tertiary">{l.category}</span>
                  </span>
                  <span className={`shrink-0 font-mono text-[11px] uppercase tracking-wider ${status.className}`}>
                    {status.label}
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-xs text-ink-tertiary">
                    {l.verifiedTrades}×
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
