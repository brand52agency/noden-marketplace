import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { searchListings } from "@/lib/search";
import { getBtcUsdRate } from "@/lib/btc-price";
import { getPulseStats, getTopListings } from "@/lib/marketplace-stats";
import SatsPrice from "@/components/SatsPrice";
import ViewToggle, { type MarketplaceView } from "@/components/ViewToggle";
import LayoutToggle, { type MarketplaceLayout } from "@/components/LayoutToggle";
import { SortMenu } from "@/components/SortMenu";
import { ListingsTable } from "@/components/ListingsTable";
import { StatusBadge } from "@/components/StatusBadge";
import { MarketplacePulse } from "@/components/MarketplacePulse";
import { TopListings } from "@/components/TopListings";
import { AgentDiscoveryPanel } from "@/components/AgentDiscoveryPanel";
import { inputFieldNames } from "@/lib/schema-preview";

export const metadata: Metadata = {
  title: "Marketplace — Noden Agent Shop",
  description:
    "Browse live capabilities AI agents can buy right now — search by category, price, and reputation. Paid over Bitcoin Lightning, held in escrow until output is verified.",
};

type Sort = "reputation" | "newest" | "price_asc" | "trades";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; view?: string; layout?: string; sort?: string }>;
}) {
  const { q, category, view: rawView, layout: rawLayout, sort: rawSort } = await searchParams;
  const view: MarketplaceView = rawView === "operator" ? "operator" : "agent";
  const sort: Sort =
    rawSort === "newest" || rawSort === "price_asc" || rawSort === "trades" ? rawSort : "reputation";
  const layout: MarketplaceLayout =
    rawLayout === "cards" ? "cards" : rawLayout === "table" ? "table" : view === "operator" ? "cards" : "table";

  const [listings, categoryRows, usdPerBtc, pulseStats, topListings] = await Promise.all([
    searchListings({ query: q, category, sort }),
    db.listing.findMany({ where: { active: true }, select: { category: true }, distinct: ["category"] }),
    getBtcUsdRate(),
    getPulseStats(),
    getTopListings(5),
  ]);
  const categories = categoryRows.map((c) => c.category).sort();

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-10 sm:px-8 lg:px-12">
      <div className="relative -mx-6 overflow-hidden px-6 pt-2 pb-6 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <div className="dot-grid pointer-events-none absolute inset-0" />
        <div className="relative max-w-2xl">
          <p className="eyebrow mb-4 w-fit">
            <span className="eyebrow-dot" />
            Marketplace
          </p>
          <h1 className="text-balance font-serif text-4xl leading-[1.05] font-semibold tracking-tighter text-ink sm:text-5xl">
            {view === "agent" ? "Live capability catalog." : "What agents can buy right now."}
          </h1>
          {view === "agent" ? (
            <p className="mt-4 text-balance text-sm text-ink-secondary sm:text-base">
              Mirrored from <code className="text-ink">GET /api/v1/listings</code> and the MCP{" "}
              <code className="text-ink">search_skills</code> tool. Grab a{" "}
              <code className="text-ink">listing_id</code>, validate your input against its schema, then call{" "}
              <code className="text-ink">POST /api/v1/orders</code> (or{" "}
              <code className="text-ink">purchase_skill</code>) with your operator API key.
            </p>
          ) : (
            <p className="mt-4 text-balance text-sm text-ink-secondary sm:text-base">
              Open to browse, no account needed. Your agent needs an API key to actually purchase —{" "}
              <Link href="/signup" className="text-accent hover:underline">set that up here</Link>.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <MarketplacePulse stats={pulseStats} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <form className="flex gap-2" action="/">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search capabilities…"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
            {category && <input type="hidden" name="category" value={category} />}
            {view === "operator" && <input type="hidden" name="view" value="operator" />}
            {layout === "cards" && <input type="hidden" name="layout" value="cards" />}
            {sort !== "reputation" && <input type="hidden" name="sort" value={sort} />}
            <button
              type="submit"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-white"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/?${new URLSearchParams({
                ...(view === "operator" ? { view } : {}),
                ...(layout === "cards" ? { layout } : {}),
                ...(sort !== "reputation" ? { sort } : {}),
                ...(q ? { q } : {}),
              }).toString()}`}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${!category ? "bg-accent text-bg" : "bg-surface-raised text-ink-secondary hover:text-ink"}`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/?${new URLSearchParams({
                  ...(view === "operator" ? { view } : {}),
                  ...(layout === "cards" ? { layout } : {}),
                  ...(sort !== "reputation" ? { sort } : {}),
                  category: c,
                  ...(q ? { q } : {}),
                }).toString()}`}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${category === c ? "bg-accent text-bg" : "bg-surface-raised text-ink-secondary hover:text-ink"}`}
              >
                {c}
              </Link>
            ))}
          </div>

          <div className="mt-4">
            <SortMenu sort={sort} view={rawView} q={q} category={category} layout={rawLayout} />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <ViewToggle view={view} q={q} category={category} layout={rawLayout} sort={rawSort} />
            <LayoutToggle layout={layout} view={rawView} q={q} category={category} sort={rawSort} />
          </div>

          <div className="mt-4">
            {listings.length === 0 && <p className="text-sm text-ink-tertiary">No listings match.</p>}

            {listings.length > 0 && layout === "table" && (
              <ListingsTable listings={listings} usdPerBtc={usdPerBtc} />
            )}

            {listings.length > 0 && layout === "cards" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((l, i) =>
                  view === "agent" ? (
                    <Link
                      key={l.id}
                      href={`/marketplace/${l.id}`}
                      style={{ animationDelay: `${Math.min(i, 14) * 25}ms` }}
                      className="animate-fade-in-up block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-ink-tertiary"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[16px] font-bold text-ink">{l.name}</h3>
                        <SatsPrice sats={l.priceSats} usdPerBtc={usdPerBtc} className="shrink-0 font-mono text-accent" />
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-tertiary">
                        <span>{l.category}</span>
                        <span>·</span>
                        <StatusBadge verifiedTrades={l.verified_trades} successRate={l.success_rate} />
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
                      style={{ animationDelay: `${Math.min(i, 14) * 25}ms` }}
                      className="animate-fade-in-up block rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-ink-tertiary"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[16px] font-bold text-ink">{l.name}</h3>
                        <span className="shrink-0 rounded-full bg-surface-raised px-2 py-0.5 text-xs text-ink-secondary">
                          {l.category}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-ink-secondary">{l.description}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-ink-tertiary">
                        <SatsPrice sats={l.priceSats} usdPerBtc={usdPerBtc} />
                        <StatusBadge verifiedTrades={l.verified_trades} successRate={l.success_rate} />
                      </div>
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <AgentDiscoveryPanel />
          <TopListings listings={topListings} />
        </aside>
      </div>
    </main>
  );
}
