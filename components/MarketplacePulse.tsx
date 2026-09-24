import type { PulseStats } from "@/lib/marketplace-stats";

export function MarketplacePulse({ stats }: { stats: PulseStats }) {
  const tiles = [
    { label: "live listings", value: stats.activeListings.toLocaleString() },
    { label: "avg quality score", value: stats.avgQualityScore === null ? "—" : `${stats.avgQualityScore.toFixed(2)} / 5` },
    { label: "categories", value: stats.categories.toLocaleString() },
    { label: "verified trades", value: stats.verifiedTrades.toLocaleString() },
    { label: "volume settled", value: `${stats.volumeSettledSats.toLocaleString()} sats` },
    { label: "orders · 7d", value: stats.ordersLast7d.toLocaleString() },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-secondary">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
          marketplace · live
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6">
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
