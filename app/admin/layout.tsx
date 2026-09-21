import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminNav from "@/components/AdminNav";
import { CurrencyProvider } from "@/lib/currency-context";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/login");
  }

  return (
    <CurrencyProvider>
      <AdminNav />
      {children}
    </CurrencyProvider>
  );
}
