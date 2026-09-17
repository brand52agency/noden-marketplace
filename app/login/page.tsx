"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-ink">Log in</h1>

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
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {state?.error && <p className="text-sm text-fail">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
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
