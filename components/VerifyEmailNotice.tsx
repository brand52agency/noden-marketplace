"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "@/lib/actions";

// Shown to signed-in operators who haven't confirmed their email yet. The free
// first call is only granted after confirmation.
export function VerifyEmailNotice({ email, sentLabel = "Resend link" }: { email: string; sentLabel?: string }) {
  const [state, formAction, pending] = useActionState(
    async (): Promise<{ error?: string; sent?: boolean } | null> => {
      const result = await resendVerificationAction();
      return result?.error ? { error: result.error } : { sent: true };
    },
    null
  );

  return (
    <div className="rounded-lg border border-accent/40 bg-accent-dim p-4">
      <p className="text-sm font-medium text-ink">Confirm your email to unlock your free first call</p>
      <p className="mt-1 text-xs text-ink-secondary">
        We sent a link to <strong className="text-ink">{email}</strong>. Check your inbox and spam folder. Until you
        confirm, calls are paid over Lightning.
      </p>
      <form action={formAction} className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink-tertiary disabled:opacity-50"
        >
          {pending ? "Sending…" : sentLabel}
        </button>
        {state?.sent && <span className="text-xs text-success">Sent — check your inbox.</span>}
        {state?.error && <span className="text-xs text-fail">{state.error}</span>}
      </form>
    </div>
  );
}
