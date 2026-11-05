import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SKUS, billingEnabled, formatUsd } from "@/lib/billing/catalog";
import { isTestMode } from "@/lib/billing/stripe";

export const metadata = { title: "Credits" };

const ERRORS: Record<string, string> = {
  unavailable: "Card payments aren't available right now. Please try again later.",
  bad_sku: "That credit pack doesn't exist.",
  verify_email: "Confirm your email address first (use the link we sent you), then buy credits.",
  hold: "Buying credits is paused on this account because of a payment dispute. Email getnoden@proton.me and we'll sort it out.",
  slow_down: "Too many checkout attempts. Wait a little while and try again.",
};

export default async function CreditsPage({ searchParams }: { searchParams: Promise<{ purchase?: string; error?: string }> }) {
  const params = await searchParams;
  const session = await auth();
  const operator = await db.operator.findUnique({ where: { id: session!.user.id } });
  if (!operator) return null;

  const [entries, purchases] = await Promise.all([
    db.creditEntry.findMany({ where: { operatorId: operator.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.purchase.findMany({ where: { operatorId: operator.id, status: { not: "pending" } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  // In Stripe test mode the buy buttons are for admin accounts only, so nobody else can get free test credits.
  const enabled = billingEnabled() && (!isTestMode() || operator.role === "admin");
  const error = params.error ? (ERRORS[params.error] ?? ERRORS.unavailable) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Credits</h1>
        <Link href="/operator/dashboard" className="text-sm text-accent hover:underline">← Dashboard</Link>
      </div>

      {params.purchase === "success" && (
        <div className="mt-4 rounded-lg border border-success/40 bg-success-bg p-4 text-sm text-ink">
          Thanks! Your payment is being confirmed. Credits appear below within a few seconds, and refresh this page if they don&apos;t.
        </div>
      )}
      {params.purchase === "cancelled" && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm text-ink-secondary">Checkout cancelled. You haven&apos;t been charged.</div>
      )}
      {error && <div className="mt-4 rounded-lg border border-fail/40 bg-fail-bg p-4 text-sm text-ink">{error}</div>}
      {operator.billingHoldAt && (
        <div className="mt-4 rounded-lg border border-fail/40 bg-fail-bg p-4 text-sm text-ink">
          Credit use is paused on this account because of a payment dispute. Email getnoden@proton.me to resolve it.
        </div>
      )}

      <section className="mt-8 rounded-lg border border-border bg-surface p-5">
        <p className="text-xs uppercase tracking-wider text-ink-tertiary">Balance</p>
        <p className="mt-1 font-mono text-3xl text-ink">
          {operator.creditBalance.toLocaleString()} <span className="text-sm text-ink-tertiary">credits</span>
        </p>
        <p className="mt-2 text-sm text-ink-secondary">
          1 credit = $0.01. A typical call costs 5 or 6 credits, so 1,000 credits is roughly 180 calls. Credits don&apos;t expire.
          When you have enough credits, your agent pays from them automatically, with no Lightning invoice.
        </p>
      </section>

      <section className="mt-6">
        <p className="mb-3 text-xs uppercase tracking-wider text-ink-tertiary">
          Buy credits {isTestMode() && enabled && <span className="ml-2 rounded-full bg-accent-dim px-2 py-0.5 normal-case text-accent">test mode, no real charges</span>}
        </p>
        {!enabled ? (
          <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-secondary">
            Card payments open soon. Until then, agents pay per call over Bitcoin Lightning.
          </div>
        ) : !operator.emailVerifiedAt ? (
          <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-secondary">
            Confirm your email address to buy credits. We sent a link when you signed up; you can resend it from the dashboard.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {SKUS.map((sku) => (
              <form key={sku.id} method="POST" action="/api/billing/checkout" className="rounded-lg border border-border bg-surface p-5">
                <input type="hidden" name="sku" value={sku.id} />
                <p className="font-mono text-xl text-ink">{sku.credits.toLocaleString()}</p>
                <p className="text-xs text-ink-tertiary">credits · about {Math.floor(sku.credits / 5.5).toLocaleString()} calls</p>
                <p className="mt-3 text-lg text-ink">{formatUsd(sku.amountCents)}</p>
                <button type="submit" className="mt-3 w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                  Buy with card
                </button>
              </form>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-ink-tertiary">
          Payments are processed by Stripe; we never see your card number. Credits are for use on Noden skills and are not refundable once spent.
        </p>
      </section>

      <section className="mt-8">
        <p className="mb-3 text-xs uppercase tracking-wider text-ink-tertiary">Recent activity</p>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-ink-tertiary">
              <tr>
                <th className="px-4 py-2 text-left">When</th>
                <th className="px-4 py-2 text-left">What</th>
                <th className="px-4 py-2 text-right">Credits</th>
                <th className="px-4 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-tertiary">Nothing yet.</td></tr>
              )}
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-2 text-ink-tertiary">{e.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-2 text-ink">{e.kind}{e.note ? ` · ${e.note}` : ""}</td>
                  <td className={`px-4 py-2 text-right font-mono ${e.delta < 0 ? "text-ink" : "text-success"}`}>{e.delta > 0 ? "+" : ""}{e.delta.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono text-ink-secondary">{e.balanceAfter.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {purchases.length > 0 && (
        <section className="mt-8">
          <p className="mb-3 text-xs uppercase tracking-wider text-ink-tertiary">Payments</p>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} className="border-t border-border first:border-t-0">
                    <td className="px-4 py-2 text-ink-tertiary">{p.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-ink">{p.credits.toLocaleString()} credits</td>
                    <td className="px-4 py-2 text-right font-mono text-ink">{formatUsd(p.amountCents)}</td>
                    <td className="px-4 py-2 text-right text-ink-secondary">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
