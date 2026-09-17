import AdminNav from "@/components/AdminNav";
import { CurrencyProvider } from "@/lib/currency-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <AdminNav />
      {children}
    </CurrencyProvider>
  );
}
