import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getKit } from "@/lib/kits";

export const metadata = { title: "My kits" };

export default async function MyKitsPage() {
  const session = await auth();
  const claims = await db.kitClaim.findMany({ where: { operatorId: session!.user.id }, orderBy: { createdAt: "desc" } });
  const kits = claims.map((c) => ({ claim: c, kit: getKit(c.kitId) })).filter((x) => x.kit);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">My kits</h1>
        <Link href="/operator/dashboard" className="text-sm text-accent hover:underline">← Dashboard</Link>
      </div>

      {kits.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          <p className="text-ink">You don&apos;t have any kits yet.</p>
          <p className="mt-1 text-sm text-ink-secondary">A kit gives your agent a set of tools, instructions and starter tasks for one job. The first one is free.</p>
          <Link href="/kits" className="mt-4 inline-block rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3a343a]">Browse kits</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {kits.map(({ claim, kit }) => (
            <Link key={claim.id} href={`/operator/kits/${kit!.id}`} className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent">
              <p className="text-lg font-semibold text-ink">{kit!.name}</p>
              <p className="mt-2 text-sm text-ink-secondary">{kit!.tagline}</p>
              <p className="mt-3 text-xs text-ink-tertiary">Added {claim.createdAt.toLocaleDateString()} · {claim.source === "free" ? "free" : claim.source}</p>
            </Link>
          ))}
        </div>
      )}
      {kits.length > 0 && (
        <p className="mt-6 text-sm text-ink-secondary">
          Looking for more? <Link href="/kits" className="text-accent hover:underline">Browse all kits →</Link>
        </p>
      )}
    </main>
  );
}
