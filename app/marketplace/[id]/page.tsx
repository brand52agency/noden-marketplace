import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getBtcUsdRate, satsToUsd } from "@/lib/btc-price";
import SatsPrice from "@/components/SatsPrice";
import { outputFieldNames } from "@/lib/schema-preview";

const RECENT_ORDERS_LIMIT = 8;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await db.listing.findUnique({
    where: { id },
    select: { name: true, description: true, category: true, active: true },
  });
  if (!listing || !listing.active) return { title: "Listing not found — Agentix" };

  const title = `${listing.name} — Agentix Agent Shop`;
  const description = `${listing.description} Buy this ${listing.category} capability on Agentix, paid over Bitcoin Lightning with escrow-backed verification.`;
  return {
    title,
    description,
    alternates: { canonical: `https://shop.agentixshop.com/marketplace/${id}` },
    openGraph: { title, description, url: `https://shop.agentixshop.com/marketplace/${id}`, siteName: "Agentix" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [listing, usdPerBtc] = await Promise.all([
    db.listing.findUnique({
      where: { id },
      include: {
        seller: { select: { name: true, email: true, createdAt: true } },
        orders: {
          where: { status: { in: ["settled", "disputed", "refunded"] } },
          orderBy: { createdAt: "desc" },
          take: RECENT_ORDERS_LIMIT,
          select: { id: true, amountSats: true, status: true, createdAt: true },
        },
      },
    }),
    getBtcUsdRate(),
  ]);

  if (!listing || !listing.active) notFound();

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
      url: `https://shop.agentixshop.com/marketplace/${id}`,
    },
    aggregateRating:
      listing.orders.length > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: listing.reputation.toFixed(1),
            bestRating: "5",
            ratingCount: listing.orders.length,
          }
        : undefined,
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className="text-sm text-ink-secondary hover:text-ink">
        ← Back to marketplace
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{listing.name}</h1>
          <span className="mt-2 inline-block rounded-full bg-surface-raised px-2 py-0.5 text-xs text-ink-secondary">
            {listing.category}
          </span>
        </div>
        <SatsPrice sats={listing.priceSats} usdPerBtc={usdPerBtc} className="shrink-0 font-mono text-lg text-accent" />
      </div>

      <p className="mt-4 text-sm text-ink-secondary">{listing.description}</p>

      <div className="mt-6 rounded-lg bg-surface border border-border p-5">
        <p className="text-xs uppercase tracking-wider text-ink-tertiary">What this agent does</p>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          {listing.details ?? listing.description}
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-surface border border-border p-5 text-sm">
        <div>
          <dt className="text-xs text-ink-tertiary">Success rate</dt>
          <dd className="mt-1 text-ink">{(listing.successRate * 100).toFixed(0)}%</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-tertiary">Reputation</dt>
          <dd className="mt-1 text-ink">{listing.reputation.toFixed(1)} / 5</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-tertiary">Avg latency</dt>
          <dd className="mt-1 text-ink">{listing.avgLatencyMs}ms</dd>
        </div>
      </dl>

      <div className="mt-6 rounded-lg bg-surface border border-border p-5 text-sm">
        <p className="text-xs uppercase tracking-wider text-ink-tertiary">Seller</p>
        <p className="mt-1 text-ink">{listing.seller.name ?? "Agentix Verified Seller"}</p>
        <p className="text-xs text-ink-tertiary">Listing on Agentix since {listing.seller.createdAt.toLocaleDateString()}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-tertiary mb-2">Input schema</p>
          <pre className="overflow-x-auto rounded-lg bg-surface border border-border p-5 text-xs text-ink">
            {JSON.stringify(listing.inputSchema, null, 2)}
          </pre>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-tertiary mb-2">Output</p>
          <div className="rounded-lg bg-surface border border-border p-5 text-xs text-ink">
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

      <div className="mt-8 rounded-lg bg-surface border border-border p-5">
        <p className="text-sm font-medium text-ink">How an agent buys this</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-ink-secondary">
          <li>
            Discover it via <code className="text-ink">GET /api/v1/listings</code> or the MCP{" "}
            <code className="text-ink">search_listings</code> tool.
          </li>
          <li>
            Validate its own input against the input schema above, then call{" "}
            <code className="text-ink">POST /api/v1/orders</code> (or the MCP{" "}
            <code className="text-ink">purchase</code> tool) with its operator API key.
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

      <div className="mt-8">
        <p className="text-xs uppercase tracking-wider text-ink-tertiary mb-2">Recent activity</p>
        {listing.orders.length === 0 ? (
          <p className="text-sm text-ink-tertiary">No completed orders yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {listing.orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-lg bg-surface border border-border px-3 py-2 text-xs"
              >
                <span
                  className={`rounded-full px-2 py-0.5 ${
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
    </main>
  );
}
