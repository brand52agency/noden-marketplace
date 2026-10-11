// Free-skill gating (lib/free-skills.ts): limits per account / IP, global ceiling, kill switches,
// input rejected before anything runs, and no payment or retry token on a free run.
// Uses a throwaway free listing unless the real one exists; deletes everything it creates.
import assert from "node:assert/strict";
import { db } from "../lib/db";
import { apiKeyFields, generateApiKey } from "../lib/api-key";
import { createOrder, getOrderStatus, MarketplaceError, registerSelfServeOperator } from "../lib/marketplace";
import { DEFS } from "./add-catalog-skills";

const TAG = `fstest-${Date.now()}`;
const IP = (n: number) => ({ get: (h: string) => (h === "x-forwarded-for" ? `198.51.100.${n}` : null) });
const status = async (p: Promise<unknown>) => {
  try { await p; return 200; } catch (e) { if (e instanceof MarketplaceError) return e.status; throw e; }
};

async function main() {
  const def = DEFS.find((d) => d.handler === "web-page-to-clean-data")!;
  const seller = await db.operator.findUniqueOrThrow({ where: { email: "verified@agentixshop.dev" } });
  let listing = await db.listing.findUnique({ where: { handler: def.handler } });
  let createdListing = false;
  if (!listing) {
    listing = await db.listing.create({
      data: { sellerId: seller.id, name: `${TAG} free skill`, category: "Data", description: def.description, details: def.details, inputSchema: def.inputSchema, outputSchema: def.outputSchema, priceSats: 0, handler: def.handler, active: true },
    });
    createdListing = true;
  }
  assert.equal(listing.priceSats, 0, "the web-page skill must be free");
  const ops: string[] = [];
  const good = { url: "https://example.com" };

  try {
    // 1. Input is refused before anything is created or counted.
    const a = await registerSelfServeOperator(); const aOp = await db.operator.findFirstOrThrow({ orderBy: { createdAt: "desc" } }); ops.push(aOp.id);
    const before = await db.order.count({ where: { buyerId: aOp.id } });
    assert.equal(await status(createOrder(a.api_key, listing.id, { url: "http://169.254.169.254/latest/meta-data" }, undefined, undefined, { headers: IP(1) })), 422);
    assert.equal(await status(createOrder(a.api_key, listing.id, { url: "http://localhost:5432" }, undefined, undefined, { headers: IP(1) })), 422);
    assert.equal(await db.order.count({ where: { buyerId: aOp.id } }), before, "refused input must not create an order");
    console.log("PASS private/metadata addresses refused with 422, no order created, nothing counted");

    // 2. Anonymous key: free, no invoice; runs on first poll; limited to 5/day per IP.
    process.env.FREE_SKILL_IP_DAILY = "5";
    const r = await createOrder(a.api_key, listing.id, good, undefined, undefined, { headers: IP(2) });
    assert.ok("free_skill" in r && r.free_skill && r.invoice === null && r.amount_sats === 0);
    const done = await getOrderStatus(r.order_id);
    assert.equal(done.status, "completed");
    assert.equal((done.output as { title: string }).title, "Example Domain");
    console.log("PASS free skill: no invoice, runs on poll, real page data returned");
    for (let i = 0; i < 4; i++) assert.equal(await status(createOrder(a.api_key, listing.id, good, undefined, undefined, { headers: IP(2) })), 200);
    assert.equal(await status(createOrder(a.api_key, listing.id, good, undefined, undefined, { headers: IP(2) })), 429);
    const b = await registerSelfServeOperator(); ops.push((await db.operator.findFirstOrThrow({ orderBy: { createdAt: "desc" } })).id);
    assert.equal(await status(createOrder(b.api_key, listing.id, good, undefined, undefined, { headers: IP(2) })), 429, "a new key from the same IP is still limited");
    console.log("PASS anonymous: 5 runs per IP per day; a fresh key from the same IP is still blocked");

    // 3. Verified account: limited per account (not per key), regardless of IP.
    process.env.FREE_SKILL_ACCOUNT_DAILY = "3";
    const key = generateApiKey();
    const v = await db.operator.create({ data: { email: `${TAG}@example.com`, passwordHash: "x", role: "buyer", emailVerifiedAt: new Date(), allowAllSellers: true, ...apiKeyFields(key) } });
    ops.push(v.id);
    for (let i = 0; i < 3; i++) assert.equal(await status(createOrder(key, listing.id, good, undefined, undefined, { headers: IP(10 + i) })), 200);
    assert.equal(await status(createOrder(key, listing.id, good, undefined, undefined, { headers: IP(99) })), 429);
    console.log("PASS verified account: limited per account, not per IP");

    // 4. Global ceiling and kill switches.
    process.env.FREE_SKILL_ACCOUNT_DAILY = "25";
    const key2 = generateApiKey();
    const v2 = await db.operator.create({ data: { email: `${TAG}-2@example.com`, passwordHash: "x", role: "buyer", emailVerifiedAt: new Date(), allowAllSellers: true, ...apiKeyFields(key2) } });
    ops.push(v2.id);
    process.env.FREE_SKILL_GLOBAL_DAILY = "0";
    assert.equal(await status(createOrder(key2, listing.id, good, undefined, undefined, { headers: IP(50) })), 429);
    delete process.env.FREE_SKILL_GLOBAL_DAILY;
    process.env.FREE_SKILLS_DISABLED = def.handler;
    assert.equal(await status(createOrder(key2, listing.id, good, undefined, undefined, { headers: IP(50) })), 503);
    delete process.env.FREE_SKILLS_DISABLED;
    process.env.FREE_SKILLS_ENABLED = "false";
    assert.equal(await status(createOrder(key2, listing.id, good, undefined, undefined, { headers: IP(50) })), 503);
    delete process.env.FREE_SKILLS_ENABLED;
    assert.equal(await status(createOrder(key2, listing.id, good, undefined, undefined, { headers: IP(50) })), 200);
    console.log("PASS global daily ceiling, per-skill and global kill switches (and recovery)");

    // 5. Free runs stay out of public trust numbers.
    const real = await db.order.count({ where: { listingId: listing.id, amountSats: { gt: 0 } } });
    assert.equal(real, 0);
    console.log("PASS free runs carry amountSats 0, so reputation and revenue stats ignore them");
  } finally {
    await db.order.deleteMany({ where: { buyerId: { in: ops } } });
    await db.auditLogEntry.deleteMany({ where: { operatorId: { in: ops } } });
    await db.rateLimitHit.deleteMany({ where: { OR: [{ bucket: { startsWith: "freeskill:" } }, { bucket: { startsWith: "register:" } }] } });
    await db.operator.deleteMany({ where: { id: { in: ops } } });
    if (createdListing) await db.listing.delete({ where: { id: listing.id } });
    await db.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
