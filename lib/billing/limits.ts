import { db } from "@/lib/db";
import { NEW_BUYER_DAILY_CREDIT_LIMIT, NEW_BUYER_WINDOW_DAYS } from "@/lib/billing/catalog";

// Returns an error message when a new buyer would go over their first-week daily credit limit, else null.
export async function newBuyerLimitMessage(operatorId: string, credits: number): Promise<string | null> {
  const firstPaid = await db.purchase.findFirst({
    where: { operatorId, status: { in: ["paid", "refunded", "disputed"] } },
    orderBy: { paidAt: "asc" },
    select: { paidAt: true },
  });
  if (!firstPaid?.paidAt) return null; // credits that were granted rather than bought (e.g. by an admin) aren't limited
  const ageMs = Date.now() - firstPaid.paidAt.getTime();
  if (ageMs > NEW_BUYER_WINDOW_DAYS * 24 * 3600 * 1000) return null;
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const spent = await db.creditEntry.aggregate({ _sum: { delta: true }, where: { operatorId, kind: "spend", createdAt: { gte: since } } });
  const usedToday = -(spent._sum.delta ?? 0);
  if (usedToday + credits > NEW_BUYER_DAILY_CREDIT_LIMIT) {
    return `new-account limit: accounts in their first ${NEW_BUYER_WINDOW_DAYS} days can spend up to ${NEW_BUYER_DAILY_CREDIT_LIMIT.toLocaleString()} credits per 24 hours (${usedToday.toLocaleString()} used). Try again later, or email getnoden@proton.me to have it raised.`;
  }
  return null;
}
