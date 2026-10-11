import { notFound } from "next/navigation";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { adminIssueRetryAction } from "@/lib/actions";
import { isFailed, isCompleted, normalizeOrderStatus } from "@/lib/order-status";
import { getBtcUsdRate } from "@/lib/btc-price";
import Amount from "@/components/Amount";

const LIFECYCLE = [
  { key: "pending", label: "Awaiting payment or result" },
  { key: "completed", label: "Result passed its check" },
] as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, usdPerBtc] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: { listing: true, buyer: true, seller: true },
    }),
    getBtcUsdRate(),
  ]);
  if (!order) notFound();

  const failed = isFailed(order.status) || order.status === "refunded";
  const stageIndex = failed
    ? 1 // the check at the end of the lifecycle failed
    : isCompleted(order.status)
      ? 1
      : 0;

  return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-ink">{order.listing.name}</h1>
        <p className="mt-1 text-sm text-ink-tertiary font-mono">{order.id}</p>

        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
          {LIFECYCLE.map((stage, i) => {
            const isFailedStage = failed && i === stageIndex;
            const done = i < stageIndex || (i === stageIndex && !failed);
            return (
              <div key={stage.key} className="flex items-center gap-3 text-sm">
                {isFailedStage ? (
                  <XCircle className="h-4 w-4 shrink-0 text-fail" strokeWidth={2.5} />
                ) : done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" strokeWidth={2.5} />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-border" strokeWidth={2.5} />
                )}
                <span className={done || isFailedStage ? "text-ink" : "text-ink-tertiary"}>
                  {isFailedStage ? `${stage.label} — ${normalizeOrderStatus(order.status)}` : stage.label}
                </span>
              </div>
            );
          })}
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-4 text-sm text-ink">
          <div><dt className="text-ink-tertiary">Buyer</dt><dd>{order.buyer.email}</dd></div>
          <div><dt className="text-ink-tertiary">Seller</dt><dd>{order.seller.email}</dd></div>
          <div><dt className="text-ink-tertiary">Amount</dt><dd className="font-mono"><Amount sats={order.amountSats} usdPerBtc={usdPerBtc} /></dd></div>
          <div>
            <dt className="text-ink-tertiary">Platform fee</dt>
            <dd className="font-mono">
              {order.platformFeeSats != null ? <Amount sats={order.platformFeeSats} usdPerBtc={usdPerBtc} /> : "—"}
            </dd>
          </div>
          <div><dt className="text-ink-tertiary">Verification</dt><dd>{order.verificationResult ?? "pending"}</dd></div>
          <div><dt className="text-ink-tertiary">Created</dt><dd>{order.createdAt.toLocaleString()}</dd></div>
          <div><dt className="text-ink-tertiary">Settled</dt><dd>{order.settledAt?.toLocaleString() ?? "—"}</dd></div>
        </dl>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-wider text-ink-tertiary mb-2">Input</p>
          <pre className="overflow-x-auto rounded-lg bg-surface p-5 border border-border text-xs text-ink">
            {JSON.stringify(order.input, null, 2)}
          </pre>
        </div>

        {order.output != null && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-ink-tertiary mb-2">Output</p>
            <pre className="overflow-x-auto rounded-lg bg-surface p-5 border border-border text-xs text-ink">
              {JSON.stringify(order.output, null, 2)}
            </pre>
          </div>
        )}

        {order.failureNote && (
          <p className="mt-4 text-sm text-fail">{order.failureNote}</p>
        )}

        {isFailed(order.status) && (
          <form action={async () => { "use server"; await adminIssueRetryAction(order.id); }} className="mt-6">
            <button type="submit" className="rounded-lg bg-fail-bg px-4 py-2 text-sm text-fail hover:opacity-80">
              Issue a free retry token to the buyer
            </button>
            <p className="mt-2 text-xs text-ink-tertiary">
              {order.retryToken ? `A retry token exists for this order (${order.retryTokenUsedAt ? "used" : "unused"}).` : "No retry token has been issued yet."}
            </p>
          </form>
        )}
      </main>
  );
}
