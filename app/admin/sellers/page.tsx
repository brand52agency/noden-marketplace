import { db } from "@/lib/db";
import { getBtcUsdRate } from "@/lib/btc-price";
import Amount from "@/components/Amount";

export default async function AdminSellersPage() {
  const [sellers, usdPerBtc] = await Promise.all([
    db.operator.findMany({ where: { role: "seller" }, include: { listings: true } }),
    getBtcUsdRate(),
  ]);

  const rows = await Promise.all(
    sellers.map(async (seller) => {
      const orders = await db.order.findMany({ where: { sellerId: seller.id } });
      const settled = orders.filter((o) => o.status === "settled");
      const disputed = orders.filter((o) => o.status === "disputed" || o.status === "refunded");
      const revenue = settled.reduce((sum, o) => sum + o.amountSats, 0);
      const avgReputation = seller.listings.length
        ? seller.listings.reduce((s, l) => s + l.reputation, 0) / seller.listings.length
        : 5;
      return {
        id: seller.id,
        email: seller.email,
        listingCount: seller.listings.length,
        revenue,
        disputeRate: orders.length ? disputed.length / orders.length : 0,
        avgReputation,
      };
    })
  );

  rows.sort((a, b) => b.revenue - a.revenue);

  return (
    <main className="mx-auto max-w-[1228px] px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Sellers</h1>

      <div className="mt-6 overflow-x-auto rounded-lg bg-surface border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-ink-tertiary text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Seller</th>
              <th className="px-4 py-2 text-right">Listings</th>
              <th className="px-4 py-2 text-right">Revenue</th>
              <th className="px-4 py-2 text-right">Reputation</th>
              <th className="px-4 py-2 text-right">Dispute rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-border text-ink ${r.disputeRate > 0.2 ? "bg-fail-bg" : ""}`}>
                <td className="px-4 py-2">{r.email}</td>
                <td className="px-4 py-2 text-right">{r.listingCount}</td>
                <td className="px-4 py-2 text-right font-mono">
                  <Amount sats={r.revenue} usdPerBtc={usdPerBtc} />
                </td>
                <td className="px-4 py-2 text-right">{r.avgReputation.toFixed(1)}</td>
                <td className={`px-4 py-2 text-right ${r.disputeRate > 0.2 ? "text-fail" : ""}`}>
                  {(r.disputeRate * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
