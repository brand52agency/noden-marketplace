import Link from "next/link";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getBtcUsdRate } from "@/lib/btc-price";
import Amount from "@/components/Amount";

const STATUSES = ["pending_payment", "paid", "verified", "disputed", "refunded", "settled"];

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const where: Prisma.OrderWhereInput = status ? { status } : {};

  const [orders, usdPerBtc] = await Promise.all([
    db.order.findMany({
      where,
      include: { listing: true, buyer: true, seller: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getBtcUsdRate(),
  ]);

  return (
    <main className="mx-auto max-w-[1228px] px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Transactions</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/transactions" className={`rounded-full px-3 py-1 text-xs ${!status ? "bg-accent text-bg" : "bg-surface-raised text-ink-secondary"}`}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/transactions?status=${s}`} className={`rounded-full px-3 py-1 text-xs ${status === s ? "bg-accent text-bg" : "bg-surface-raised text-ink-secondary"}`}>
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg bg-surface border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink-tertiary text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Listing</th>
              <th className="px-4 py-2 text-left">Buyer</th>
              <th className="px-4 py-2 text-left">Seller</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-tertiary">No orders match.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border hover:bg-surface">
                <td className="px-4 py-2">
                  <Link href={`/admin/transactions/${o.id}`} className="text-accent hover:underline">
                    {o.listing.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-secondary">{o.buyer.email}</td>
                <td className="px-4 py-2 text-ink-secondary">{o.seller.email}</td>
                <td className="px-4 py-2 text-right font-mono text-ink">
                  <Amount sats={o.amountSats} usdPerBtc={usdPerBtc} />
                </td>
                <td className="px-4 py-2 text-ink">{o.status.replace("_", " ")}</td>
                <td className="px-4 py-2 text-ink-tertiary">{o.createdAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
