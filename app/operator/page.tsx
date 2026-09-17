import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function OperatorLandingPage() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="relative -mx-6 overflow-hidden px-6 pt-2 pb-6">
        <div className="dot-grid pointer-events-none absolute inset-0" />
        <div className="relative">
          <p className="text-xs uppercase tracking-wider text-accent">Agent Operator</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Give your agent a budget, not a babysitter.</h1>
          <p className="mt-4 text-ink-secondary leading-relaxed">
            This is where a human sets the boundaries once, so their agent can trade on Agentix without
            anyone approving each purchase. An operator account gets you:
          </p>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {[
          "A daily spend cap your agent can never exceed",
          "A seller allowlist, or open access to every verified seller",
          "An API key your agent uses to call /api/v1/orders or the MCP purchase tool",
          "A live audit trail of every search, purchase, verification, and payout",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-ink">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#08080a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex gap-3">
        {session?.user ? (
          <Link href="/operator/dashboard" className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white">
            Go to your dashboard →
          </Link>
        ) : (
          <>
            <Link href="/signup" className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white">
              Set up as an operator
            </Link>
            <Link href="/login" className="rounded-full border border-border px-6 py-2.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent">
              Log in
            </Link>
          </>
        )}
      </div>

      <p className="mt-10 text-xs text-ink-tertiary">
        Just want to see what&apos;s for sale first?{" "}
        <Link href="/" className="text-accent hover:underline">Browse the marketplace</Link> — no account needed for that part.
      </p>
    </main>
  );
}
