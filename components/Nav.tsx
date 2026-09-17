import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import Logo from "./Logo";

const links = [
  { label: "Use Cases", href: "https://agentixshop.com/use-cases" },
  { label: "Features", href: "https://agentixshop.com/features" },
  { label: "Resources", href: "https://agentixshop.com/resources" },
  { label: "Pricing", href: "https://agentixshop.com/pricing" },
];

export default async function Nav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/75 backdrop-blur">
      <div className="mx-auto flex max-w-[1228px] items-center justify-between px-6 py-4">
        <a href="https://agentixshop.com" className="flex items-center">
          <Logo height={32} />
        </a>

        <nav className="hidden items-center gap-6 text-[14px] text-ink-secondary lg:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="transition-colors hover:text-ink">
              {l.label}
            </a>
          ))}
          <Link href={session?.user ? "/operator/dashboard" : "/operator"} className="transition-colors hover:text-ink">
            Agent Operators
          </Link>
          {session?.user?.role === "admin" && (
            <Link href="/admin/overview" className="transition-colors hover:text-ink">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
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
              <Link href="/signup" className="hidden text-sm text-ink-secondary transition-colors hover:text-ink sm:block">
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
      </div>
    </header>
  );
}
