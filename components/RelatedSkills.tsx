import Link from "next/link";
import SatsPrice from "@/components/SatsPrice";
import { StatusBadge } from "@/components/StatusBadge";
import type { RelatedListing } from "@/lib/marketplace-stats";

export function RelatedSkills({
  listings,
  usdPerBtc,
  view,
}: {
  listings: RelatedListing[];
  usdPerBtc: number;
  view?: string;
}) {
  const suffix = view === "operator" ? "?view=operator" : "";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">related skills</p>

      {listings.length === 0 ? (
        <p className="mt-4 text-sm text-ink-tertiary">No other listings in this category yet.</p>
      ) : (
        <div className="mt-3 flex flex-col divide-y divide-border">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/marketplace/${l.id}${suffix}`}
              className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-ink"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{l.name}</span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-tertiary">{l.category}</span>
              </span>
              <span className="shrink-0 text-right">
                <SatsPrice sats={l.priceSats} usdPerBtc={usdPerBtc} className="block font-mono text-xs text-accent" />
                <span className="mt-1 block">
                  <StatusBadge verifiedTrades={l.verifiedTrades} successRate={l.successRate} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <Link href="/" className="mt-4 inline-block text-xs text-accent hover:underline">
        Browse full catalog →
      </Link>
    </div>
  );
}
