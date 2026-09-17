import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import Logo from "./Logo";

export default async function Nav() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/75 backdrop-blur">
      <div className="mx-auto flex max-w-[1228px] items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          <Logo height={32} />
        </Link>

        <nav className="hidden items-center gap-6 text-[14px] text-ink-secondary sm:flex">
          <Link href={session?.user ? "/operator/dashboard" : "/operator"} className="transition-colors hover:text-ink">
            Agent Operator
          </Link>
          {session?.user?.role === "admin" && (
            <Link href="/admin/overview" className="transition-colors hover:text-ink">Admin</Link>
          )}
        </nav>

        {session?.user ? (
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-[42px] items-center justify-center rounded-full bg-ink px-5 text-[12px] font-medium text-bg transition-colors hover:bg-accent hover:text-white"
            >
              Log out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-[42px] items-center justify-center rounded-full bg-ink px-5 text-[12px] font-medium text-bg transition-colors hover:bg-accent hover:text-white"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
