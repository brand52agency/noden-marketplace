// Free skills (NODEN_PRICING_TASKS.md D3/F6): code-backed listings priced at 0. They cost Noden
// almost nothing per call, but they are still limited so they can't be used as free infrastructure.
//   - kill switch: FREE_SKILLS_ENABLED=false stops all of them; FREE_SKILLS_DISABLED=key1,key2 stops some
//   - a verified account gets FREE_SKILL_ACCOUNT_DAILY runs a day, counted per account (not per key)
//   - anything else (anonymous keys) gets FREE_SKILL_IP_DAILY a day per IP and 4x that per /24 network
//   - a global ceiling, FREE_SKILL_GLOBAL_DAILY runs a day, after which the skills are "back tomorrow"
import { db } from "@/lib/db";
import { FREE_SKILL_HASH_PREFIX } from "@/lib/order-status";
import { clientIp, networkOf, rateLimit } from "@/lib/rate-limit";

const DAY = 24 * 3600;
const num = (v: string | undefined, d: number) => (v !== undefined && Number.isFinite(Number(v)) ? Number(v) : d);

export const freeSkillConfig = () => ({
  enabled: process.env.FREE_SKILLS_ENABLED !== "false",
  disabled: (process.env.FREE_SKILLS_DISABLED ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  accountDaily: num(process.env.FREE_SKILL_ACCOUNT_DAILY, 25),
  ipDaily: num(process.env.FREE_SKILL_IP_DAILY, 5),
  globalDaily: num(process.env.FREE_SKILL_GLOBAL_DAILY, 2000),
});

export type FreeSkillDenial = { message: string; status: number; retryAfterSec?: number };

// Returns null when the run is allowed (and counts it), else why not.
export async function claimFreeSkillRun(
  operator: { id: string; emailVerifiedAt: Date | null },
  handlerKey: string,
  headers?: { get(name: string): string | null }
): Promise<FreeSkillDenial | null> {
  const cfg = freeSkillConfig();
  if (!cfg.enabled || cfg.disabled.includes(handlerKey)) {
    return { message: "this free skill is switched off right now. Try again later.", status: 503 };
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const usedToday = await db.order.count({ where: { railPaymentHash: { startsWith: FREE_SKILL_HASH_PREFIX }, createdAt: { gte: startOfDay } } });
  if (usedToday >= cfg.globalDaily) {
    return { message: "today's free runs are used up. They reset at 00:00 UTC, so try again tomorrow.", status: 429, retryAfterSec: secondsToMidnightUtc() };
  }

  if (operator.emailVerifiedAt) {
    const r = await rateLimit(`freeskill:acct:${operator.id}`, cfg.accountDaily, DAY);
    if (!r.ok) return { message: `free-skill limit reached: ${cfg.accountDaily} runs a day per account.`, status: 429, retryAfterSec: r.retryAfterSec };
    return null;
  }

  const ip = headers ? clientIp(headers) : "unknown";
  const a = await rateLimit(`freeskill:ip:${ip}`, cfg.ipDaily, DAY);
  if (!a.ok) {
    return {
      message: `free-skill limit reached: ${cfg.ipDaily} runs a day without a verified account. Sign up and confirm your email at https://shop.getnoden.com/signup for ${cfg.accountDaily} a day.`,
      status: 429,
      retryAfterSec: a.retryAfterSec,
    };
  }
  const n = await rateLimit(`freeskill:net:${networkOf(ip)}`, cfg.ipDaily * 4, DAY);
  if (!n.ok) return { message: "free-skill limit reached for your network today.", status: 429, retryAfterSec: n.retryAfterSec };
  return null;
}

function secondsToMidnightUtc() {
  const t = new Date();
  const next = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - t.getTime()) / 1000));
}
