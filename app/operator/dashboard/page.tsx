import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeOrderStatus } from "@/lib/order-status";
import { regenerateApiKeyAction, revokeApiKeyAction } from "@/lib/actions";
import { NewKeyBanner } from "@/components/NewKeyBanner";
import { VerifyEmailNotice } from "@/components/VerifyEmailNotice";

function StatusBadge({ status }: { status: string }) {
  const shown = normalizeOrderStatus(status);
  const tone: Record<string, string> = {
    completed: "text-success bg-success-bg",
    failed: "text-fail bg-fail-bg",
    refunded: "text-ink-secondary bg-surface-raised",
    pending: "text-accent bg-accent-dim",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${tone[shown]}`}>
      {shown}
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
      <div className="mt-4 empty:hidden">
        <NewKeyBanner />
      </div>
      {!operator.emailVerifiedAt && (
        <div className="mt-4">
          <VerifyEmailNotice email={operator.email} />
        </div>
      )}

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
          {operator.apiKeyPrefix ? `${operator.apiKeyPrefix}…` : "No active key"}
        </code>
        <p className="mt-2 text-xs text-ink-tertiary">
          We store only a hash of your key, so it can&apos;t be shown again. Regenerating replaces the current key immediately.
        </p>
        <div className="mt-3 flex gap-5">
          <form action={regenerateApiKeyAction}>
            <button type="submit" className="text-sm text-accent hover:underline">
              {operator.apiKeyHash ? "Regenerate key" : "Create a key"}
            </button>
          </form>
          {operator.apiKeyHash && (
            <form action={revokeApiKeyAction}>
              <button type="submit" className="text-sm text-fail hover:underline">
                Revoke key
              </button>
            </form>
          )}
        </div>
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
