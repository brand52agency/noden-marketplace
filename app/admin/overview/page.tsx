import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { daysAgo } from "@/lib/dates";
import { PLATFORM_FEE_RATE } from "@/lib/fees";
import { getBtcUsdRate } from "@/lib/btc-price";
import Amount from "@/components/Amount";

function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg bg-surface p-5 border border-border">
      <p className="text-xs uppercase tracking-wider text-ink-tertiary">{label}</p>
      <p className="mt-1 text-2xl font-mono text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-tertiary">{sub}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const since30d = daysAgo(30);

  const [settled, allRecent, distinctBuyers, distinctSellers, usdPerBtc] = await Promise.all([
    db.order.findMany({ where: { status: "settled" }, select: { amountSats: true, platformFeeSats: true, settledAt: true } }),
    db.order.findMany({ where: { createdAt: { gte: since30d } }, select: { buyerId: true, sellerId: true, createdAt: true } }),
    db.order.findMany({ where: { createdAt: { gte: since30d } }, select: { buyerId: true }, distinct: ["buyerId"] }),
    db.order.findMany({ where: { createdAt: { gte: since30d } }, select: { sellerId: true }, distinct: ["sellerId"] }),
    getBtcUsdRate(),
  ]);

  const grossVolume = settled.reduce((sum, o) => sum + o.amountSats, 0);
  // platformFeeSats is only set on orders settled after this field shipped;
  // any older settled order predates third-party sellers entirely, so the
  // full amount was retained — same as it is today.
  const revenue = settled.reduce((sum, o) => sum + (o.platformFeeSats ?? o.amountSats), 0);

  const days: { label: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = daysAgo(i);
    const label = day.toISOString().slice(5, 10);
    const count = allRecent.filter((o) => o.createdAt.toISOString().slice(0, 10) === day.toISOString().slice(0, 10)).length;
    days.push({ label, count });
  }
  const maxCount = Math.max(1, ...days.map((d) => d.count));

  return (
    <main className="mx-auto max-w-[1228px] px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatTile
          label="Revenue"
          value={<Amount sats={revenue} usdPerBtc={usdPerBtc} />}
          sub={`100% while Noden is the only seller, ${(PLATFORM_FEE_RATE * 100).toFixed(1)}% once third parties sell`}
        />
        <StatTile label="Gross volume" value={<Amount sats={grossVolume} usdPerBtc={usdPerBtc} />} />
        <StatTile label="Settled orders" value={settled.length.toLocaleString()} />
        <StatTile label="Active buyers (30d)" value={distinctBuyers.length.toString()} />
        <StatTile label="Active sellers (30d)" value={distinctSellers.length.toString()} />
      </div>

      <div className="mt-8 rounded-lg bg-surface p-5 border border-border">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-wider text-ink-tertiary">Orders placed per day — last 30 days</p>
          <p className="text-xs text-ink-tertiary">
            {allRecent.length.toLocaleString()} total · busiest day {maxCount.toLocaleString()}
          </p>
        </div>

        <div className="flex h-28 items-end gap-1">
          {days.map((d) => (
            <div key={d.label} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-[10px] text-ink-tertiary opacity-0 transition-opacity group-hover:opacity-100">
                {d.count > 0 ? d.count : ""}
              </span>
              <div
                className="w-full rounded-t bg-accent/70 transition-colors group-hover:bg-accent"
                style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? "3px" : "1px" }}
              />
            </div>
          ))}
        </div>

        <div className="mt-2 flex justify-between text-[10px] text-ink-tertiary">
          <span>{days[0].label}</span>
          <span>{days[Math.floor(days.length / 2)].label}</span>
          <span>{days[days.length - 1].label}</span>
        </div>
      </div>
    </main>
  );
}
