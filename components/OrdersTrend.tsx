import type { TrendPoint } from "@/lib/marketplace-stats";

export function OrdersTrend({ points }: { points: TrendPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((s, p) => s + p.count, 0);
  const width = 280;
  const height = 56;
  const barWidth = width / points.length;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">orders · 14d</p>
        <p className="font-mono text-xs text-ink-secondary">{total} total</p>
      </div>

      {total === 0 ? (
        <p className="mt-6 text-sm text-ink-tertiary">Not enough activity yet.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" preserveAspectRatio="none" aria-hidden="true">
          {points.map((p, i) => {
            const h = Math.max((p.count / max) * (height - 4), p.count > 0 ? 3 : 0);
            return (
              <rect
                key={p.day}
                x={i * barWidth + 1}
                y={height - h}
                width={Math.max(barWidth - 2, 1)}
                height={h}
                rx={1}
                className={p.count > 0 ? "fill-accent" : "fill-border"}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
