import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import Logo from "./Logo";
import { MobileMenu } from "./MobileMenu";

// Same primary nav as getnoden.com, link for link and in the same order. "Docs" points at the agent setup
// instructions until a full docs section exists.
// KEEP IN SYNC with agentix/components/Nav.tsx (the marketing site). "Get an agent" and "Learn" are shown there
// only while their publish flags are on; both are on today, so they are always listed here.
const links = [
  { label: "Product", href: "https://getnoden.com/features" },
  { label: "Marketplace", href: "/" },
  { label: "Kits", href: "/kits" },
  { label: "Pricing", href: "https://getnoden.com/pricing" },
  { label: "Docs", href: "https://getnoden.com/connect" },
  { label: "Get an agent", href: "https://getnoden.com/get-an-agent" },
  { label: "Learn", href: "https://getnoden.com/meet-the-agents" },
  { label: "Blog", href: "https://getnoden.com/blog" },
  { label: "Sell", href: "https://getnoden.com/sell" },
];

const btn = "items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium leading-tight transition-colors";
const btnPrimary = `inline-flex ${btn} bg-ink text-white hover:bg-[#3a343a]`;
const btnOutline = `${btn} border border-border bg-white text-ink hover:bg-bg`;

export default async function Nav() {
  const session = await auth();
  const signedIn = !!session?.user;

  const mobileLinks = [
    ...links,
    ...(signedIn ? [{ label: "Dashboard", href: "/operator/dashboard" }] : []),
    ...(session?.user?.role === "admin" ? [{ label: "Admin", href: "/admin/overview" }] : []),
  ];

  return (
    <header className="sticky top-3 z-50 px-3 pt-3 sm:px-[30px]">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-3 rounded-2xl bg-white px-4 shadow-[0_1px_2px_rgba(35,31,35,0.05),0_8px_30px_rgba(35,31,35,0.06)] sm:px-5">
        <a href="https://getnoden.com" className="flex items-center">
          <Logo height={32} className="h-8 w-auto" />
        </a>

        <nav className="hidden items-center gap-6 text-[14px] text-ink xl:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="whitespace-nowrap transition-opacity hover:opacity-60">
              {l.label}
            </a>
          ))}
          {signedIn && (
            <Link href="/operator/dashboard" className="whitespace-nowrap transition-opacity hover:opacity-60">
              Dashboard
            </Link>
          )}
          {session?.user?.role === "admin" && (
            <Link href="/admin/overview" className="whitespace-nowrap transition-opacity hover:opacity-60">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {signedIn ? (
            <form action={logoutAction}>
              <button type="submit" className={btnPrimary}>
                Log out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className={`hidden xl:inline-flex ${btnOutline}`}>
                Sign in
              </Link>
              {/* Visible at every width, so the primary CTA never hides in the mobile drawer. */}
              <Link href="/signup" className={btnPrimary}>
                Start free
              </Link>
            </>
          )}

          <MobileMenu links={mobileLinks}>
            {signedIn ? (
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-center text-sm font-medium text-ink"
                >
                  Log out
                </button>
              </form>
            ) : (
              <Link href="/login" className="rounded-xl border border-border px-4 py-2.5 text-center text-sm font-medium text-ink">
                Sign in
              </Link>
            )}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
