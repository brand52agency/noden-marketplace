"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, null);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-ink">Create your operator account</h1>
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
    </main>
  );
}
