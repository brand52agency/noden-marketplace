import Link from "next/link";
import type { Metadata } from "next";
import { KITS, isFreeKit } from "@/lib/kits";

export const metadata: Metadata = {
  title: "Agent kits — ready-made skill bundles for your AI agent | Noden",
  description: "A kit is a set of real tools, ready-made instructions and starter tasks for one job. Start with the free Website Care Kit.",
  alternates: { canonical: "https://shop.getnoden.com/kits" },
};

export default function KitsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="eyebrow mb-5 w-fit">
        <span className="eyebrow-dot" />
        Agent kits
      </p>
      <h1 className="text-balance font-serif text-4xl leading-[1.05] font-semibold tracking-tighter text-ink sm:text-5xl">
        An agent that already knows the job.
      </h1>
      <p className="mt-6 max-w-2xl text-base text-ink-secondary sm:text-lg">
        A kit bundles real tools, ready-made instructions and starter tasks for one kind of work. Add it to your account, connect your agent, and start.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {KITS.map((k) => (
          <Link key={k.id} href={`/kits/${k.id}`} className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-ink">{k.name}</h2>
              <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-medium text-success">{isFreeKit(k) ? "Free" : `$${k.priceCents / 100}`}</span>
            </div>
            <p className="mt-3 text-sm text-ink-secondary">{k.tagline}</p>
            <p className="mt-4 text-xs text-ink-tertiary">{k.skills.length} skills · {k.starterTasks.length} starter tasks</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
