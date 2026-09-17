import { redirect } from "next/navigation";

// The marketplace listing now lives at "/" (the app's main page). This
// keeps old /marketplace links and bookmarks working.
export default async function MarketplaceRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (category) qs.set("category", category);
  const suffix = qs.toString();
  redirect(suffix ? `/?${suffix}` : "/");
}
