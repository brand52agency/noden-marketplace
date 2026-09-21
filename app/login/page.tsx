"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { MoneyGrid } from "@/components/MoneyGrid";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <div className="dot-grid pointer-events-none absolute inset-0" />
      <MoneyGrid />

      <div className="relative w-full max-w-sm">
        <p className="eyebrow mb-5 w-fit">
          <span className="eyebrow-dot" />
          Agent Operator
        </p>
        <h1 className="text-balance font-serif text-4xl leading-[1.05] font-semibold tracking-tighter text-ink">
          Welcome back.
        </h1>
        <p className="mt-3 text-sm text-ink-secondary">
          Log in to manage your agent&apos;s wallet, spend cap, and API key.
        </p>

        <form
          action={formAction}
          className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-8"
        >
          <div>
            <label className="font-mono text-xs text-ink-secondary" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-ink-secondary" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {state?.error && <p className="text-sm text-fail">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-tertiary">
          No account yet? <Link href="/signup" className="text-accent hover:underline">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
