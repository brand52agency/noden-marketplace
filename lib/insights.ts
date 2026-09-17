import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

export const INSIGHTS_CONFIGURED = Boolean(process.env.ANTHROPIC_API_KEY);

const CACHE_TTL_MS = 24 * 3600_000;

async function buildDataSummary() {
  const since = new Date(Date.now() - 30 * 86400_000);
  const orders = await db.order.findMany({
    where: { createdAt: { gte: since } },
    include: { listing: true },
  });

  const byCategory: Record<string, { count: number; revenue: number; disputes: number }> = {};
  const bySeller: Record<string, { count: number; revenue: number; disputes: number }> = {};

  for (const o of orders) {
    const cat = (byCategory[o.listing.category] ??= { count: 0, revenue: 0, disputes: 0 });
    const sel = (bySeller[o.sellerId] ??= { count: 0, revenue: 0, disputes: 0 });
    cat.count += 1;
    sel.count += 1;
    if (o.status === "settled") {
      cat.revenue += o.amountSats;
      sel.revenue += o.amountSats;
    }
    if (o.status === "disputed" || o.status === "refunded") {
      cat.disputes += 1;
      sel.disputes += 1;
    }
  }

  return {
    windowDays: 30,
    totalOrders: orders.length,
    settled: orders.filter((o) => o.status === "settled").length,
    disputed: orders.filter((o) => o.status === "disputed" || o.status === "refunded").length,
    byCategory,
    bySeller,
  };
}

export async function getInsights(forceRegenerate = false): Promise<{ content: string; generatedAt: Date; cached: boolean }> {
  if (!forceRegenerate) {
    const cached = await db.insightsCache.findUnique({ where: { id: "singleton" } });
    if (cached && Date.now() - cached.generatedAt.getTime() < CACHE_TTL_MS) {
      return { content: cached.content, generatedAt: cached.generatedAt, cached: true };
    }
  }

  if (!INSIGHTS_CONFIGURED) {
    return {
      content:
        "Insights aren't configured — set ANTHROPIC_API_KEY in .env to generate data-driven recommendations here.",
      generatedAt: new Date(),
      cached: false,
    };
  }

  const summary = await buildDataSummary();
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2000,
    system:
      "You are a marketplace operations analyst for Agentix, a Bitcoin Lightning marketplace where AI agents buy capabilities from other agents. You're given the last 30 days of order data aggregated by category and seller. Give concrete, numbered, actionable recommendations — cite the actual numbers you were given. If the data is too sparse to say anything meaningful, say so plainly instead of inventing patterns.",
    messages: [
      {
        role: "user",
        content: `Here is the last 30 days of marketplace data as JSON:\n\n${JSON.stringify(summary, null, 2)}\n\nGive your recommendations.`,
      },
    ],
  });

  const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text ?? "";

  await db.insightsCache.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", content: text },
    update: { content: text, generatedAt: new Date() },
  });

  return { content: text, generatedAt: new Date(), cached: false };
}
