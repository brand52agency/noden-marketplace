import { db } from "@/lib/db";
import { priceCreditsLite } from "@/lib/credits";
import { COMPLETED_VALUES } from "@/lib/order-status";
import { REAL_COMPLETED_WHERE, REAL_ORDER_WHERE } from "@/lib/reputation";

export type PulseStats = {
  activeListings: number;
  avgQualityScore: number | null;
  categories: number;
  verifiedTrades: number;
  volumeSettledSats: number;
  ordersLast7d: number;
  minPriceSats: number | null;
  maxPriceSats: number | null;
  minCredits: number | null;
  maxCredits: number | null;
};

// All real aggregates off Listing/Order — no placeholder numbers. See
// lib/reputation.ts for why we're careful about that on this project.
export async function getPulseStats(): Promise<PulseStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [activeListings, tradedListings, categoryRows, verifiedTrades, volume, ordersLast7d, priceRows] = await Promise.all([
    db.listing.count({ where: { active: true } }),
    // Reputation defaults to 5.0 for a listing that's never traded — that's
    // not an earned score, so averaging it in would be fabricating quality
    // data. Only listings with a real verified trade count here.
    db.listing.findMany({
      where: { active: true },
      select: {
        reputation: true,
        _count: { select: { orders: { where: REAL_COMPLETED_WHERE } } },
      },
    }),
    db.listing.findMany({ where: { active: true }, select: { category: true }, distinct: ["category"] }),
    db.order.count({ where: REAL_COMPLETED_WHERE }),
    db.order.aggregate({ _sum: { amountSats: true }, where: { status: { in: [...COMPLETED_VALUES] }, ...REAL_ORDER_WHERE } }),
    db.order.count({ where: { createdAt: { gte: sevenDaysAgo }, ...REAL_ORDER_WHERE } }),
    db.listing.findMany({ where: { active: true }, select: { id: true, priceSats: true } }),
  ]);
  const credits = priceRows.map((l) => priceCreditsLite(l.id, l.priceSats));

  const traded = tradedListings.filter((l) => l._count.orders > 0);
  const avgQualityScore = traded.length
    ? traded.reduce((sum, l) => sum + l.reputation, 0) / traded.length
    : null;

  return {
    activeListings,
    avgQualityScore,
    categories: categoryRows.length,
    verifiedTrades,
    volumeSettledSats: volume._sum.amountSats ?? 0,
    ordersLast7d,
    minPriceSats: priceRows.length ? Math.min(...priceRows.map((l) => l.priceSats)) : null,
    maxPriceSats: priceRows.length ? Math.max(...priceRows.map((l) => l.priceSats)) : null,
    minCredits: credits.length ? Math.min(...credits) : null,
    maxCredits: credits.length ? Math.max(...credits) : null,
  };
}

export type RankedListing = {
  id: string;
  name: string;
  category: string;
  reputation: number;
  successRate: number;
  verifiedTrades: number;
};

// Ranked purely by real verified-trade count (ties broken by reputation) —
// nothing here is a default/placeholder score.
export async function getTopListings(limit = 5): Promise<RankedListing[]> {
  const listings = await db.listing.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      category: true,
      reputation: true,
      successRate: true,
      _count: { select: { orders: { where: REAL_COMPLETED_WHERE } } },
    },
  });

  return listings
    .map((l) => ({
      id: l.id,
      name: l.name,
      category: l.category,
      reputation: l.reputation,
      successRate: l.successRate,
      verifiedTrades: l._count.orders,
    }))
    .filter((l) => l.verifiedTrades > 0)
    .sort((a, b) => b.verifiedTrades - a.verifiedTrades || b.reputation - a.reputation)
    .slice(0, limit);
}

export type RelatedListing = {
  id: string;
  name: string;
  category: string;
  priceSats: number;
  priceCredits: number;
  reputation: number;
  successRate: number;
  verifiedTrades: number;
};

// Other active listings in the same category — real catalog rows, ordered
// the same way the main catalog defaults (reputation desc, price asc).
export async function getRelatedListings(category: string, excludeId: string, limit = 5): Promise<RelatedListing[]> {
  const listings = await db.listing.findMany({
    where: { active: true, category, id: { not: excludeId } },
    orderBy: [{ reputation: "desc" }, { priceSats: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      category: true,
      priceSats: true,
      reputation: true,
      successRate: true,
      _count: { select: { orders: { where: REAL_COMPLETED_WHERE } } },
    },
  });

  return listings.map((l) => ({
    id: l.id,
    name: l.name,
    category: l.category,
    priceSats: l.priceSats,
    priceCredits: priceCreditsLite(l.id, l.priceSats),
    reputation: l.reputation,
    successRate: l.successRate,
    verifiedTrades: l._count.orders,
  }));
}

export type TrendPoint = { day: string; count: number };

// Daily order counts for the last N days, real createdAt timestamps bucketed
// in-process (keeps this portable across the SQLite/Postgres split noted in
// schema.prisma, rather than relying on a Postgres-only date_trunc).
export async function getOrderTrend(days = 14): Promise<TrendPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const orders = await db.order.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([day, count]) => ({ day, count }));
}
