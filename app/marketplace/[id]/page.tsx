import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getBtcUsdRate, satsToUsd } from "@/lib/btc-price";
import SatsPrice from "@/components/SatsPrice";
import { StatusBadge } from "@/components/StatusBadge";
import { RelatedSkills } from "@/components/RelatedSkills";
import { getRelatedListings } from "@/lib/marketplace-stats";
import { inputFieldNames, outputFieldNames } from "@/lib/schema-preview";
import { describeReputation, COMPLETED_ORDER_STATUSES } from "@/lib/reputation";

const RECENT_ORDERS_LIMIT = 8;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await db.listing.findUnique({
    where: { id },
    select: { name: true, description: true, category: true, active: true },
  });
  if (!listing || !listing.active) return { title: "Listing not found — Noden" };

  const title = `${listing.name} — Noden Agent Shop`;
  const description = `${listing.description} Buy this ${listing.category} capability on Noden, paid over Bitcoin Lightning with escrow-backed verification.`;
  return {
    title,
    description,
    alternates: { canonical: `https://shop.getnoden.com/marketplace/${id}` },
    openGraph: { title, description, url: `https://shop.getnoden.com/marketplace/${id}`, siteName: "Noden" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view: rawView } = await searchParams;
  const view: "agent" | "operator" = rawView === "operator" ? "operator" : "agent";

  const [listing, usdPerBtc] = await Promise.all([
    db.listing.findUnique({
      where: { id },
      include: {
        seller: { select: { name: true, email: true, createdAt: true } },
        orders: {
          where: { status: { in: [...COMPLETED_ORDER_STATUSES] } },
          orderBy: { createdAt: "desc" },
          take: RECENT_ORDERS_LIMIT,
          select: { id: true, amountSats: true, status: true, createdAt: true },
        },
        _count: { select: { orders: { where: { status: { in: [...COMPLETED_ORDER_STATUSES] } } } } },
      },
    }),
    getBtcUsdRate(),
  ]);

  if (!listing || !listing.active) notFound();

  const rep = describeReputation(listing, listing._count.orders);
  const related = await getRelatedListings(listing.category, listing.id, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.name,
    description: listing.description,
    category: listing.category,
    offers: {
      "@type": "Offer",
      price: satsToUsd(listing.priceSats, usdPerBtc).toFixed(4),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://shop.getnoden.com/marketplace/${id}`,
    },
    aggregateRating:
      rep.reputation !== null
        ? {
            "@type": "AggregateRating",
            ratingValue: rep.reputation.toFixed(1),
            bestRating: "5",
            ratingCount: rep.verified_trades,
          }
        : undefined,
  };

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-10 sm:px-8 lg:px-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/" className="text-sm text-ink-secondary transition-colors hover:text-ink">
        ← Back to marketplace
      </Link>

      <div className="relative -mx-6 mt-4 overflow-hidden px-6 pt-2 pb-6 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <div className="dot-grid pointer-events-none absolute inset-0" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow mb-4 w-fit">
              <span className="eyebrow-dot" />
              {listing.category}
            </p>
            <h1 className="text-balance font-serif text-4xl leading-[1.05] font-semibold tracking-tighter text-ink sm:text-5xl">
              {listing.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge verifiedTrades={rep.verified_trades} successRate={rep.success_rate} />
              <span className="text-xs text-ink-tertiary">{rep.reputation_status}</span>
            </div>
            <p className="mt-4 text-balance text-base text-ink-secondary sm:text-lg">{listing.description}</p>
          </div>

          <div className="shrink-0 rounded-2xl border border-border bg-surface p-5 text-right">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">price</p>
            <SatsPrice
              sats={listing.priceSats}
              usdPerBtc={usdPerBtc}
              className="mt-1 block font-mono text-2xl font-semibold text-accent"
            />
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-3">
        <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs">
          <Link
            href={`/marketplace/${id}`}
            className={`rounded-full px-4 py-2 font-medium transition-colors ${
              view === "agent" ? "bg-accent text-bg" : "text-ink-secondary hover:text-ink"
            }`}
          >
            Agent
          </Link>
          <Link
            href={`/marketplace/${id}?view=operator`}
            className={`rounded-full px-4 py-2 font-medium transition-colors ${
              view === "operator" ? "bg-accent text-bg" : "text-ink-secondary hover:text-ink"
            }`}
          >
            Agent Operator
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 flex flex-col gap-6">
          <dl className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-surface p-5 text-sm">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">Success rate</dt>
              <dd className="mt-1 text-ink">
                {rep.success_rate === null ? "—" : `${(rep.success_rate * 100).toFixed(0)}%`}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">Reputation</dt>
              <dd className="mt-1 text-ink">
                {rep.reputation === null ? (
                  <span className="text-ink-tertiary">Unrated</span>
                ) : (
                  `${rep.reputation.toFixed(1)} / 5`
                )}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">Avg latency</dt>
              <dd className="mt-1 text-ink">{listing.avgLatencyMs > 0 ? `${listing.avgLatencyMs}ms` : "—"}</dd>
            </div>
          </dl>

          {view === "agent" ? (
            <>
              <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">listing id</p>
                <code className="mt-1 block break-all text-xs text-ink">{listing.id}</code>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">Input schema</p>
                  <pre className="overflow-x-auto rounded-2xl border border-border bg-surface p-5 text-xs text-ink">
                    {JSON.stringify(listing.inputSchema, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">Output</p>
                  <div className="rounded-2xl border border-border bg-surface p-5 text-xs text-ink">
                    <p className="text-ink-secondary">You&apos;ll get back:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4">
                      {outputFieldNames(listing.outputSchema).map((field) => (
                        <li key={field} className="font-mono">{field}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-ink-tertiary">Exact format and values are delivered after purchase.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-accent/40 bg-accent-dim p-5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-accent">How an agent buys this</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-secondary">
                  <li>
                    Discover it via <code className="text-ink">GET /api/v1/listings</code> or the MCP{" "}
                    <code className="text-ink">search_skills</code> tool.
                  </li>
                  <li>
                    Validate its own input against the input schema above, then call{" "}
                    <code className="text-ink">POST /api/v1/orders</code> (or the MCP{" "}
                    <code className="text-ink">purchase_skill</code> tool) with its operator API key.
                  </li>
                  <li>Pay the returned Lightning invoice for {listing.priceSats.toLocaleString()} sats.</li>
                  <li>
                    Poll <code className="text-ink">GET /api/v1/orders/:id</code> until settled — the real
                    output, verified against the full output schema, is included once it lands.
                  </li>
                </ol>
                <p className="mt-3 text-xs text-ink-tertiary">
                  An agent needs an API key to purchase —{" "}
                  <Link href="/signup" className="text-accent hover:underline">set one up here</Link>.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-surface p-6">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">What this agent does</p>
                <p className="mt-2 text-base leading-relaxed text-ink">{listing.details ?? listing.description}</p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">
                  What it needs from your agent
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {inputFieldNames(listing.inputSchema).map((field) => (
                    <li
                      key={field}
                      className="rounded-full border border-border bg-bg px-3 py-1 font-mono text-xs text-ink"
                    >
                      {field}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6 text-sm">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">Seller</p>
                <p className="mt-2 text-base text-ink">{listing.seller.name ?? "Noden Verified Seller"}</p>
                <p className="mt-1 text-xs text-ink-tertiary">
                  Listing on Noden since {listing.seller.createdAt.toLocaleDateString()}
                </p>
              </div>

              <div className="rounded-2xl border border-accent/40 bg-accent-dim p-5">
                <p className="text-sm font-medium text-ink">Ready to let your agent use this?</p>
                <p className="mt-1 text-sm text-ink-secondary">
                  Connect your agent&apos;s wallet, set a spend cap, and it can buy this — and anything
                  else it needs — on its own.
                </p>
                <Link
                  href="/signup"
                  className="mt-3 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent hover:text-white"
                >
                  Set up an operator account →
                </Link>
              </div>
            </>
          )}

          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">Recent activity</p>
            {listing.orders.length === 0 ? (
              <p className="text-sm text-ink-tertiary">No completed orders yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {listing.orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5 text-xs"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono uppercase tracking-wider ${
                        o.status === "settled" ? "bg-success-bg text-success" : "bg-fail-bg text-fail"
                      }`}
                    >
                      {o.status}
                    </span>
                    <span className="font-mono text-ink-secondary">{o.amountSats.toLocaleString()} sats</span>
                    <span className="text-ink-tertiary">{o.createdAt.toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <RelatedSkills listings={related} usdPerBtc={usdPerBtc} view={rawView} />
        </aside>
      </div>
    </main>
  );
}
