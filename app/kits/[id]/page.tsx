import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getKit, isFreeKit, kitSkillViews } from "@/lib/kits";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const kit = getKit((await params).id);
  if (!kit) return {};
  return {
    title: `${kit.name} — free agent kit | Noden`,
    description: kit.tagline,
    alternates: { canonical: `https://shop.getnoden.com/kits/${kit.id}` },
  };
}

export default async function KitPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const kit = getKit((await params).id);
  if (!kit) notFound();
  const { error } = await searchParams;

  const session = await auth();
  const skills = await kitSkillViews(kit);
  const owned = session?.user?.id
    ? Boolean(await db.kitClaim.findUnique({ where: { operatorId_kitId: { operatorId: session.user.id, kitId: kit.id } }, select: { id: true } }))
    : false;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link href="/kits" className="text-sm text-ink-secondary hover:text-ink">← All kits</Link>
      <p className="eyebrow mb-5 mt-6 w-fit">
        <span className="eyebrow-dot" />
        {isFreeKit(kit) ? "Free kit" : "Agent kit"}
      </p>
      <h1 className="text-balance font-serif text-4xl leading-[1.05] font-semibold tracking-tighter text-ink sm:text-5xl">{kit.name}</h1>
      <p className="mt-5 max-w-2xl text-base text-ink-secondary sm:text-lg">{kit.tagline}</p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        {error === "slow_down" && <p className="mb-3 text-sm text-fail">Too many attempts. Please wait a little and try again.</p>}
        {owned ? (
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-ink">This kit is in your account.</p>
            <Link href={`/operator/kits/${kit.id}`} className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3a343a]">Open my kit</Link>
          </div>
        ) : session?.user ? (
          <form method="POST" action="/api/kits/claim" className="flex flex-wrap items-center gap-4">
            <input type="hidden" name="kit" value={kit.id} />
            <button type="submit" className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3a343a]">Get this kit, free</button>
            <p className="text-sm text-ink-secondary">Adds it to your account. No card needed.</p>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <Link href={`/signup`} className="rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3a343a]">Create a free account</Link>
            <Link href={`/login?from=${encodeURIComponent(`/kits/${kit.id}`)}`} className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink hover:bg-bg">Sign in</Link>
            <p className="text-sm text-ink-secondary">Kits live in your account, so you need to be signed in to get one.</p>
          </div>
        )}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">What it is</h2>
        <p className="mt-3 max-w-2xl text-ink-secondary">{kit.description}</p>
        <p className="mt-3 max-w-2xl text-sm text-ink-tertiary"><strong className="font-medium text-ink-secondary">Who it&apos;s for:</strong> {kit.forWho}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">The skills inside</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {skills.map((s) => (
            <li key={s.handler} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-ink">{s.name}</p>
                <span className="shrink-0 text-xs text-ink-tertiary">{s.credits === 0 ? "Free" : `${s.credits} credits per call`}</span>
              </div>
              <p className="mt-1 text-sm text-ink-secondary">{s.why}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-tertiary">Free skills have daily limits. Paid skills use credits (1 credit = $0.01), which you can buy once you&apos;re signed in.</p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">Tasks to try first</h2>
        <ul className="mt-4 list-disc pl-5 text-ink-secondary">
          {kit.starterTasks.map((t) => (
            <li key={t.title} className="mt-1">{t.title}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
