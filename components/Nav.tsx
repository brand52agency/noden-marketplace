import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import Logo from "./Logo";
import { MobileMenu } from "./MobileMenu";

const links = [
  { label: "Features", href: "https://getnoden.com/features" },
  { label: "Use Cases", href: "https://getnoden.com/use-cases" },
  { label: "Resources", href: "https://getnoden.com/resources" },
  { label: "Pricing", href: "https://getnoden.com/pricing" },
];

export default async function Nav() {
  const session = await auth();

  const mobileLinks = [
    ...links,
    ...(session?.user ? [{ label: "Dashboard", href: "/operator/dashboard" }] : []),
    ...(session?.user?.role === "admin" ? [{ label: "Admin", href: "/admin/overview" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/75 backdrop-blur">
      <div className="mx-auto flex max-w-[1228px] items-center justify-between px-6 py-4">
        <a href="https://getnoden.com" className="flex items-center">
          <Logo height={32} />
        </a>

        <nav className="hidden items-center gap-6 text-[14px] text-ink-secondary lg:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
          {session?.user && (
            <Link href="/operator/dashboard" className="transition-colors hover:text-ink">
              Dashboard
            </Link>
          )}
          {session?.user?.role === "admin" && (
            <Link href="/admin/overview" className="transition-colors hover:text-ink">Admin</Link>
          )}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {session?.user ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white"
              >
                Log out
              </button>
            </form>
          ) : (
            <>
              <Link href="/signup" className="text-sm text-ink-secondary transition-colors hover:text-ink">
                Sign Up
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white"
              >
                Login
              </Link>
            </>
          )}
          <Link
            href="/"
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white"
          >
            View Agent Shop
          </Link>
        </div>

        <MobileMenu links={mobileLinks}>
          {session?.user ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-ink"
              >
                Log out
              </button>
            </form>
          ) : (
            <>
              <Link
                href="/signup"
                className="rounded-lg px-2 py-2.5 text-base text-ink transition-colors hover:bg-surface-raised"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-ink"
              >
                Login
              </Link>
            </>
          )}
          <Link
            href="/"
            className="rounded-full bg-ink px-4 py-2.5 text-center text-sm font-medium text-bg"
          >
            View Agent Shop
          </Link>
        </MobileMenu>
      </div>
    </header>
  );
}
