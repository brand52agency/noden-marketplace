import Link from "next/link";
import CurrencyToggle from "./CurrencyToggle";

export default function AdminNav() {
  return (
    <nav className="mx-auto flex max-w-[1228px] items-center gap-5 px-6 pt-6 text-sm text-ink-secondary">
      <Link href="/admin/overview" className="hover:text-ink">Overview</Link>
      <Link href="/admin/transactions" className="hover:text-ink">Transactions</Link>
      <Link href="/admin/sellers" className="hover:text-ink">Sellers</Link>
      <Link href="/admin/insights" className="hover:text-ink">Insights</Link>
      <Link href="/operator/dashboard" className="ml-auto hover:text-ink">← Back to operator view</Link>
      <CurrencyToggle />
    </nav>
  );
}
