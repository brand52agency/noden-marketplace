import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { regenerateApiKeyAction } from "@/lib/actions";

function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    settled: "text-success bg-success-bg",
    disputed: "text-fail bg-fail-bg",
    refunded: "text-ink-secondary bg-surface-raised",
    pending_payment: "text-accent bg-accent-dim",
    paid: "text-accent bg-accent-dim",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${tone[status] ?? "text-ink-secondary bg-surface-raised"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const operator = await db.operator.findUnique({ where: { id: session!.user.id } });
  if (!operator) return null;

  const orders = await db.order.findMany({
    where: { buyerId: operator.id },
    include: { listing: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const usagePct = operator.spendCapDailySats > 0
    ? Math.min(100, (operator.spendUsedTodaySats / operator.spendCapDailySats) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>

      {operator.spendCapDailySats === 0 && (
        <div className="mt-4 rounded-lg border border-accent/40 bg-accent-dim p-4 text-sm text-ink">
          You haven&apos;t set a spend cap yet — your agent can&apos;t purchase anything until
          you do. <Link href="/operator/setup" className="text-accent hover:underline">Finish setup →</Link>
        </div>
      )}

      <section className="mt-8 rounded-lg bg-surface p-5 border border-border">
        <p className="text-xs uppercase tracking-wider text-ink-tertiary">Spend cap — today</p>
        <p className="mt-1 text-2xl font-mono text-ink">
          {operator.spendUsedTodaySats.toLocaleString()}{" "}
          <span className="text-sm text-ink-tertiary">/ {operator.spendCapDailySats.toLocaleString()} sats</span>
        </p>
        <div className="mt-3 h-2 rounded-full bg-surface-raised">
          <div className="h-full rounded-full bg-accent" style={{ width: `${usagePct}%` }} />
        </div>
        <Link href="/operator/setup" className="mt-3 inline-block text-sm text-accent hover:underline">
          Edit wallet settings →
        </Link>
      </section>

      <section className="mt-6 rounded-lg bg-surface p-5 border border-border">
        <p className="text-xs uppercase tracking-wider text-ink-tertiary">API key</p>
        <code className="mt-2 block break-all rounded bg-bg border border-border px-3 py-2 text-sm text-ink">
          {operator.apiKey.slice(0, 8)}{"…".repeat(1)}{operator.apiKey.slice(-4)}
        </code>
        <form action={regenerateApiKeyAction}>
          <button type="submit" className="mt-3 text-sm text-accent hover:underline">
            Regenerate key
          </button>
        </form>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-ink-tertiary">Your orders</p>
          <Link href="/" className="text-sm text-accent hover:underline">
            Browse the marketplace →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-lg bg-surface border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-ink-tertiary text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Listing</th>
                <th className="px-4 py-2 text-right">Sats</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-tertiary">No orders yet.</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-2 text-ink">{o.listing.name}</td>
                  <td className="px-4 py-2 text-right font-mono text-ink">{o.amountSats.toLocaleString()}</td>
                  <td className="px-4 py-2"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-2 text-ink-tertiary">{o.createdAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
