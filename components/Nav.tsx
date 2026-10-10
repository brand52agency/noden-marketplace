import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import Logo from "./Logo";
import { MobileMenu } from "./MobileMenu";

// Same primary nav as getnoden.com. "Docs" points at the agent setup
// instructions until a full docs section exists.
const links = [
  { label: "Product", href: "https://getnoden.com/features" },
  { label: "Marketplace", href: "/" },
  { label: "Pricing", href: "https://getnoden.com/pricing" },
  { label: "Docs", href: "https://getnoden.com/connect" },
  { label: "Sell", href: "https://getnoden.com/sell" },
];

export default async function Nav() {
  const session = await auth();
  const signedIn = !!session?.user;

  const mobileLinks = [
    ...links,
    ...(signedIn ? [{ label: "Dashboard", href: "/operator/dashboard" }] : []),
    ...(session?.user?.role === "admin" ? [{ label: "Admin", href: "/admin/overview" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/75 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-6 py-4 sm:px-8 lg:px-12 lg:py-5 2xl:px-20">
        <a href="https://getnoden.com" className="flex items-center">
          <Logo height={32} className="h-8 w-auto lg:h-9 2xl:h-10" />
        </a>

        <nav className="hidden items-center gap-6 text-[14px] text-ink-secondary lg:flex 2xl:gap-8 2xl:text-base">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
          {signedIn && (
            <Link href="/operator/dashboard" className="transition-colors hover:text-ink">
              Dashboard
            </Link>
          )}
          {session?.user?.role === "admin" && (
            <Link href="/admin/overview" className="transition-colors hover:text-ink">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-3 lg:gap-5">
          {signedIn ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white 2xl:px-5 2xl:py-2.5 2xl:text-base"
              >
                Log out
              </button>
            </form>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-ink-secondary transition-colors hover:text-ink lg:inline 2xl:text-base"
              >
                Sign in
              </Link>
              {/* Visible at every width, so the primary CTA never hides in the mobile drawer. */}
              <Link
                href="/signup"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white 2xl:px-5 2xl:py-2.5 2xl:text-base"
              >
                Start free
              </Link>
            </>
          )}

          <MobileMenu links={mobileLinks}>
            {signedIn ? (
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-ink"
                >
                  Log out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-ink"
              >
                Sign in
              </Link>
            )}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
