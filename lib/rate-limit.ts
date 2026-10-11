// Sliding-window limits kept in Postgres (RateLimitHit), so they work across serverless instances
// without a separate store. Used for key creation, signup and anything else that can be farmed.
import { db } from "@/lib/db";

export type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export async function rateLimit(bucket: string, limit: number, windowSec: number): Promise<LimitResult> {
  const since = new Date(Date.now() - windowSec * 1000);
  const count = await db.rateLimitHit.count({ where: { bucket, createdAt: { gte: since } } });
  if (count >= limit) {
    // The window reopens when the hit that is `limit` places from the newest ages out.
    const edge = await db.rateLimitHit.findMany({
      where: { bucket, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      skip: count - limit,
      take: 1,
      select: { createdAt: true },
    });
    const reopens = edge[0] ? edge[0].createdAt.getTime() + windowSec * 1000 : Date.now() + windowSec * 1000;
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((reopens - Date.now()) / 1000)) };
  }
  await db.rateLimitHit.create({ data: { bucket } });
  // Housekeeping: drop hits older than two days now and then.
  if (Math.random() < 0.02) {
    await db.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 2 * 24 * 3600 * 1000) } } });
  }
  return { ok: true };
}

export function clientIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

// One bucket per address, and one per network, so rotating addresses inside one range doesn't help:
// IPv4 /24, IPv6 /64 (approximated by the first four groups).
export function networkOf(ip: string): string {
  if (ip.includes(":")) return ip.split(":").slice(0, 4).join(":") + "::/64";
  const p = ip.split(".");
  return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0/24` : ip;
}

// Applies the per-IP and per-network limits for one action. Returns null when allowed.
export async function limitByClient(
  action: string,
  headers: { get(name: string): string | null },
  limits: { perIp: number; perNetwork: number; windowSec: number }
): Promise<{ retryAfterSec: number } | null> {
  const ip = clientIp(headers);
  const a = await rateLimit(`${action}:ip:${ip}`, limits.perIp, limits.windowSec);
  if (!a.ok) return { retryAfterSec: a.retryAfterSec };
  const b = await rateLimit(`${action}:net:${networkOf(ip)}`, limits.perNetwork, limits.windowSec);
  if (!b.ok) return { retryAfterSec: b.retryAfterSec };
  return null;
}
