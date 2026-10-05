import type { PulseStats } from "@/lib/marketplace-stats";

export function MarketplacePulse({ stats }: { stats: PulseStats }) {
  // Trade-derived tiles only appear once real, paid trades exist — until then
  // they'd all read zero, and padding the row with seeded/demo numbers would
  // be misleading. See REAL_ORDER_WHERE in lib/reputation.ts.
  const hasTrades = stats.verifiedTrades > 0;

  const tiles = [
    { label: "live listings", value: stats.activeListings.toLocaleString() },
    { label: "categories", value: stats.categories.toLocaleString() },
    ...(stats.minPriceSats !== null && stats.maxPriceSats !== null
      ? [{ label: "price range", value: `${stats.minPriceSats}–${stats.maxPriceSats} sats` }]
      : []),
    ...(hasTrades
      ? [
          { label: "avg quality score", value: stats.avgQualityScore === null ? "—" : `${stats.avgQualityScore.toFixed(2)} / 5` },
          { label: "verified trades", value: stats.verifiedTrades.toLocaleString() },
          { label: "volume settled", value: `${stats.volumeSettledSats.toLocaleString()} sats` },
        ]
      : []),
  ];

  const gridCols = tiles.length <= 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-secondary">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
          marketplace · live
        </p>
        {!hasTrades && (
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
            no completed trades yet — be the first
          </p>
        )}
      </div>
      <div className={`grid ${gridCols} divide-x divide-y divide-border`}>
        {tiles.map((t, i) => (
          <div key={t.label} className="animate-fade-in-up p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">{t.label}</p>
            <p className="mt-2 truncate font-mono text-xl font-semibold text-ink sm:text-2xl">{t.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
