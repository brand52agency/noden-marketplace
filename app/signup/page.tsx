"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Wallet, Eye } from "lucide-react";
import { signupAction } from "@/lib/actions";

const builderPoints = [
  {
    icon: ShieldCheck,
    title: "You stay in control",
    body: "Set a spending cap per agent, per day or week — your agent can never exceed it.",
  },
  {
    icon: Wallet,
    title: "Your wallet, your custody",
    body: "Connect any Lightning wallet via NWC. Noden never holds your funds.",
  },
  {
    icon: Eye,
    title: "Full visibility",
    body: "See exactly what every agent bought, from whom, and why — a live ledger, not a black box.",
  },
];

const perks = [
  "A daily spend cap your agent can never exceed",
  "A seller allowlist, or open access to every verified seller",
  "An API key your agent uses to call /api/v1/orders or the MCP purchase_skill tool",
  "A live audit trail of every search, purchase, verification, and payout",
];

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, null);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="relative -mx-6 overflow-hidden px-6 pt-2 pb-6 lg:mx-0 lg:px-0">
          <div className="dot-grid pointer-events-none absolute inset-0" />
          <div className="relative">
            <p className="text-xs uppercase tracking-wider text-accent">Agent Operator</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Give your agent a budget, not a babysitter.</h1>
            <p className="mt-4 text-ink-secondary leading-relaxed">
              This is where a human sets the boundaries once, so their agent can trade on Noden without
              anyone approving each purchase. An operator account gets you:
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {perks.map((item) => (
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

            <p className="mt-8 text-xs text-ink-tertiary">
              Just want to see what&apos;s for sale first?{" "}
              <Link href="/" className="text-accent hover:underline">Browse the marketplace</Link> — no account
              needed for that part.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-ink">Create your operator account</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            One account funds your agent&apos;s wallet, sets its spend cap, and issues its API key.
          </p>

          <form action={formAction} className="mt-8 flex flex-col gap-4">
            <div>
              <label className="text-sm text-ink-secondary" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-sm text-ink-secondary" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>

            {state?.error && <p className="text-sm text-fail">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
            >
              {pending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-tertiary">
            Already have an account? <Link href="/login" className="text-accent hover:underline">Log in</Link>
          </p>
        </div>
      </div>

      <div className="mt-24 border-t border-border pt-16">
        <p className="eyebrow mx-auto mb-6 w-fit">
          <span className="eyebrow-dot" />
          For builders &amp; operators
        </p>
        <h2 className="text-balance text-center">Connect your agent. Set a budget. Let it shop.</h2>
        <p className="mx-auto mt-4 max-w-xl text-balance text-center text-[15px] text-ink-secondary">
          Your agent gets its own scoped, budgeted wallet connection — it can pay for what it needs,
          and never more than you allow.
        </p>

        <div className="mt-14 flex flex-col gap-8 lg:flex-row">
          <div className="lg:w-1/2">
            <Image
              src="/for-builders.png"
              alt="A small business owner and their agent shopping for capabilities together."
              width={990}
              height={800}
              className="w-full rounded-2xl border border-border object-cover"
            />
          </div>

          <div className="flex flex-col gap-4 lg:w-1/2">
            {builderPoints.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-surface p-6">
                <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                <h3 className="mt-4">{title}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
