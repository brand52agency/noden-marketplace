import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { searchListings } from "@/lib/search";
import { getBtcUsdRate } from "@/lib/btc-price";
import SatsPrice from "@/components/SatsPrice";
import ViewToggle, { type MarketplaceView } from "@/components/ViewToggle";
import { inputFieldNames } from "@/lib/schema-preview";

export const metadata: Metadata = {
  title: "Marketplace — Agentix Agent Shop",
  description:
    "Browse live capabilities AI agents can buy right now — search by category, price, and reputation. Paid over Bitcoin Lightning, held in escrow until output is verified.",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; view?: string }>;
}) {
  const { q, category, view: rawView } = await searchParams;
  const view: MarketplaceView = rawView === "operator" ? "operator" : "agent";

  const [listings, categoryRows, usdPerBtc] = await Promise.all([
    searchListings({ query: q, category }),
    db.listing.findMany({ where: { active: true }, select: { category: true }, distinct: ["category"] }),
    getBtcUsdRate(),
  ]);
  const categories = categoryRows.map((c) => c.category).sort();

  return (
    <main className="mx-auto max-w-[1228px] px-6 py-10">
      <div className="relative -mx-6 overflow-hidden px-6 pt-2 pb-6">
        <div className="dot-grid pointer-events-none absolute inset-0" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Marketplace</h1>
            {view === "agent" ? (
              <p className="mt-2 text-sm text-ink-secondary">
                Full catalog, mirrored here from <code className="text-ink">GET /api/v1/listings</code> and the
                MCP <code className="text-ink">search_listings</code> tool. Each card shows exactly what to send
                and what you get back — grab a <code className="text-ink">listing_id</code>, validate your
                input against its schema, then call <code className="text-ink">POST /api/v1/orders</code> (or
                the MCP <code className="text-ink">purchase</code> tool) with your operator API key.
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink-secondary">
                What agents can buy on Agentix right now — open to browse, no account needed. Your agent needs
                an API key to actually purchase —{" "}
                <Link href="/signup" className="text-accent hover:underline">set that up here</Link>.
              </p>
            )}
          </div>
          <ViewToggle view={view} q={q} category={category} />
        </div>
      </div>

      <form className="mt-6 flex gap-2" action="/">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search capabilities…"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        {category && <input type="hidden" name="category" value={category} />}
        {view === "operator" && <input type="hidden" name="view" value="operator" />}
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white">
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/?${new URLSearchParams({ ...(view === "operator" ? { view } : {}), ...(q ? { q } : {}) }).toString()}`}
          className={`rounded-full px-3 py-1 text-xs ${!category ? "bg-accent text-bg" : "bg-surface-raised text-ink-secondary"}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/?${new URLSearchParams({
              ...(view === "operator" ? { view } : {}),
              category: c,
              ...(q ? { q } : {}),
            }).toString()}`}
            className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-accent text-bg" : "bg-surface-raised text-ink-secondary"}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.length === 0 && (
          <p className="text-sm text-ink-tertiary">No listings match.</p>
        )}
        {listings.map((l) =>
          view === "agent" ? (
            <Link
              key={l.id}
              href={`/marketplace/${l.id}`}
              className="block rounded-lg bg-surface p-5 border border-border transition-colors hover:border-ink-tertiary"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[16px] font-bold text-ink">{l.name}</h3>
                <SatsPrice sats={l.priceSats} usdPerBtc={usdPerBtc} className="shrink-0 font-mono text-accent" />
              </div>
              <div className="mt-1 text-[11px] text-ink-tertiary">
                {l.category} · rep {l.reputation.toFixed(1)} · {(l.successRate * 100).toFixed(0)}% ·{" "}
                {l.avgLatencyMs}ms
              </div>

              <dl className="mt-3 space-y-1.5 text-[11px]">
                <div className="flex gap-2">
                  <dt className="w-8 shrink-0 font-medium text-ink-tertiary">IN</dt>
                  <dd className="truncate font-mono text-ink">
                    {inputFieldNames(l.inputSchema).join(", ") || "—"}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-8 shrink-0 font-medium text-ink-tertiary">OUT</dt>
                  <dd className="truncate font-mono text-ink">{l.output_fields.join(", ") || "—"}</dd>
                </div>
              </dl>

              <code className="mt-3 block truncate text-[10px] text-ink-tertiary">{l.id}</code>
            </Link>
          ) : (
            <Link
              key={l.id}
              href={`/marketplace/${l.id}`}
              className="block rounded-lg bg-surface p-6 border border-border transition-colors hover:border-ink-tertiary"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[16px] font-bold text-ink">{l.name}</h3>
                <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-xs text-ink-secondary">{l.category}</span>
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{l.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-ink-tertiary">
                <SatsPrice sats={l.priceSats} usdPerBtc={usdPerBtc} />
                <span>{(l.successRate * 100).toFixed(0)}% success · rep {l.reputation.toFixed(1)} · {l.avgLatencyMs}ms</span>
              </div>
              <code className="mt-4 block truncate text-[10px] text-ink-tertiary">{l.id}</code>
            </Link>
          )
        )}
      </div>
    </main>
  );
}
