import Link from "next/link";
import type { Metadata } from "next";
import { verifyEmailToken } from "@/lib/verification";

export const metadata: Metadata = { title: "Confirm your email — Noden", robots: { index: false } };

// Verification links are single-use and the token is never logged or echoed.
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailToken(token) : ({ status: "invalid" } as const);

  const content = {
    verified: result.status === "verified" && result.trialGranted
      ? { title: "Email confirmed", body: "Your free first call is ready. Use your API key on any listing priced at or below the trial cap — the response will say free_trial: true." }
      : { title: "Email confirmed", body: result.status === "verified" ? "Your email is confirmed. The free first call for this address has already been used, so calls are paid over Lightning." : "" },
    already_verified: { title: "Already confirmed", body: "This account's email is already confirmed." },
    invalid: { title: "That link didn't work", body: "It may have expired or already been used. Sign in and use “Resend link” to get a new one." },
  }[result.status];

  return (
    <main className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold text-ink">{content.title}</h1>
      <p className="mt-4 text-base text-ink-secondary">{content.body}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/operator/dashboard" className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent hover:text-white">
          Go to dashboard
        </Link>
        <Link href="/" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink-tertiary">
          Browse skills
        </Link>
      </div>
    </main>
  );
}
