// API-key hashing, revoke/rotate, the failed-call pause and the per-IP / per-network limits.
// Runs against the real database and deletes everything it creates.
import assert from "node:assert/strict";
import { db } from "../lib/db";
import { REVOKED_KEY_FIELDS, apiKeyFields, generateApiKey, hashApiKey } from "../lib/api-key";
import { MarketplaceError, createOrder, getOperatorByApiKey, registerSelfServeOperator, registerSelfServeOperatorLimited } from "../lib/marketplace";
import { FAILED_CALLS_PER_HOUR, keyPauseStatus } from "../lib/abuse";
import { rateLimit, networkOf } from "../lib/rate-limit";

const TAG = `abuse-${Date.now()}`;
const created: string[] = [];
const buckets: string[] = [];

async function expect401(p: Promise<unknown>, label: string) {
  try {
    await p;
  } catch (e) {
    assert.equal((e as MarketplaceError).status, 401, `${label}: expected 401`);
    return;
  }
  assert.fail(`${label}: expected a 401`);
}

async function main() {
  const listing = await db.listing.findFirstOrThrow({ where: { active: true, handler: null }, select: { id: true, sellerId: true } });

  try {
    // 1. New keys are stored only as hashes.
    const { api_key } = await registerSelfServeOperator();
    const row = await db.operator.findUniqueOrThrow({ where: { apiKeyHash: hashApiKey(api_key) } });
    created.push(row.id);
    assert.equal(row.apiKey, null, "plaintext must not be stored");
    assert.equal(row.apiKeyPrefix, api_key.slice(0, 8));
    assert.equal((await getOperatorByApiKey(api_key)).id, row.id);
    await expect401(getOperatorByApiKey(api_key + "x"), "wrong key");
    console.log("PASS new key stored as a hash only (plaintext column empty); auth works; wrong key -> 401");

    // 2. A legacy plaintext key still works once, and is upgraded (plaintext removed) on use.
    const legacyKey = generateApiKey();
    const legacy = await db.operator.create({ data: { email: `${TAG}-legacy@example.com`, passwordHash: "x", role: "buyer", apiKey: legacyKey } });
    created.push(legacy.id);
    assert.equal((await getOperatorByApiKey(legacyKey)).id, legacy.id);
    const upgraded = await db.operator.findUniqueOrThrow({ where: { id: legacy.id } });
    assert.equal(upgraded.apiKey, null, "plaintext must be removed after first use");
    assert.equal(upgraded.apiKeyHash, hashApiKey(legacyKey));
    assert.equal((await getOperatorByApiKey(legacyKey)).id, legacy.id, "still works via the hash");
    console.log("PASS legacy plaintext key authenticates once and is upgraded to a hash");

    // 3. Rotate and revoke take effect immediately.
    const newKey = generateApiKey();
    await db.operator.update({ where: { id: row.id }, data: { ...apiKeyFields(newKey), apiKey: null } });
    await expect401(getOperatorByApiKey(api_key), "old key after rotation");
    assert.equal((await getOperatorByApiKey(newKey)).id, row.id);
    await db.operator.update({ where: { id: row.id }, data: REVOKED_KEY_FIELDS });
    await expect401(getOperatorByApiKey(newKey), "revoked key");
    console.log("PASS rotating replaces the old key at once; revoking kills the key");

    // 4. Failed-call pause: too many failures in an hour pauses the key, lifts as they age, notifies once.
    const key4 = generateApiKey();
    const op = await db.operator.create({ data: { email: `${TAG}-fails@example.com`, passwordHash: "x", role: "buyer", spendCapDailySats: 5000, ...apiKeyFields(key4) } });
    created.push(op.id);
    const addFailure = (minutesAgo: number, n: number) =>
      db.order.create({
        data: {
          buyerId: op.id, sellerId: listing.sellerId, listingId: listing.id, input: {}, amountSats: 0,
          railInvoiceRef: "x", railPaymentHash: `retry_${TAG}_${n}_${Math.random()}`, status: "failed",
          createdAt: new Date(Date.now() - minutesAgo * 60000),
        },
      });
    for (let i = 0; i < FAILED_CALLS_PER_HOUR - 1; i++) await addFailure(10 + i, i);
    assert.equal((await keyPauseStatus(op.id)).paused, false, "one below the limit is not paused");
    await addFailure(5, 99);
    const paused = await keyPauseStatus(op.id);
    assert.ok(paused.paused && paused.resumesInMinutes >= 1 && paused.resumesInMinutes <= 60);
    for (let i = 0; i < 2; i++) {
      try {
        await createOrder(key4, listing.id, {});
        assert.fail("a paused key must not be able to order");
      } catch (e) {
        assert.equal((e as MarketplaceError).status, 429);
        assert.match((e as Error).message, /paused/);
      }
    }
    const notices = await db.auditLogEntry.count({ where: { operatorId: op.id, action: "key_paused" } });
    assert.equal(notices, 1, "the owner is told once per pause window, not on every attempt");
    // Failures older than an hour don't count.
    await db.order.updateMany({ where: { buyerId: op.id }, data: { createdAt: new Date(Date.now() - 2 * 3600_000) } });
    assert.equal((await keyPauseStatus(op.id)).paused, false, "pause lifts as failures age out");
    console.log(`PASS key pauses at ${FAILED_CALLS_PER_HOUR} failures/hour (HTTP 429), owner notified once, lifts as failures age out`);

    // 5. Sliding-window limiter.
    const bucket = `${TAG}:test`;
    buckets.push(bucket);
    for (let i = 0; i < 3; i++) assert.equal((await rateLimit(bucket, 3, 60)).ok, true);
    const blocked = await rateLimit(bucket, 3, 60);
    assert.ok(!blocked.ok && blocked.retryAfterSec >= 1 && blocked.retryAfterSec <= 60);
    assert.equal((await rateLimit(`${bucket}:other`, 3, 60)).ok, true, "buckets are independent");
    buckets.push(`${bucket}:other`);
    assert.equal(networkOf("203.0.113.77"), "203.0.113.0/24");
    assert.equal(networkOf("2001:db8:aaaa:bbbb:1:2:3:4"), "2001:db8:aaaa:bbbb::/64");
    console.log("PASS sliding-window limiter blocks past the limit with Retry-After; networks group by /24 and /64");

    // 6. Anonymous key creation: 5 per IP, 20 per network range per hour.
    const a = Math.floor(Math.random() * 200) + 20, b = Math.floor(Math.random() * 250);
    const ipHdr = (last: number) => ({ get: (n: string) => (n === "x-forwarded-for" ? `10.${a}.${b}.${last}` : null) });
    const made: string[] = [];
    for (let i = 0; i < 5; i++) made.push((await registerSelfServeOperatorLimited(ipHdr(1))).api_key);
    try {
      await registerSelfServeOperatorLimited(ipHdr(1));
      assert.fail("6th key from one IP must be refused");
    } catch (e) {
      assert.equal((e as MarketplaceError).status, 429);
      assert.ok((e as MarketplaceError).retryAfterSec && (e as MarketplaceError).retryAfterSec! > 0);
    }
    // Rotating addresses inside the same /24 doesn't help: 15 more from other IPs fill the network's 20.
    for (let ip = 2; ip <= 4; ip++) for (let i = 0; i < 5; i++) made.push((await registerSelfServeOperatorLimited(ipHdr(ip))).api_key);
    try {
      await registerSelfServeOperatorLimited(ipHdr(9));
      assert.fail("21st key from one /24 must be refused");
    } catch (e) {
      assert.equal((e as MarketplaceError).status, 429);
    }
    for (const k of made) {
      const o = await db.operator.findUnique({ where: { apiKeyHash: hashApiKey(k) } });
      if (o) created.push(o.id);
    }
    buckets.push("register:global", `register:ip:10.${a}.${b}.1`, `register:ip:10.${a}.${b}.2`, `register:ip:10.${a}.${b}.3`, `register:ip:10.${a}.${b}.4`, `register:ip:10.${a}.${b}.9`, `register:net:10.${a}.${b}.0/24`);
    console.log("PASS anonymous key creation: 5 per IP and 20 per /24 per hour, then HTTP 429 with Retry-After");
  } finally {
    await db.order.deleteMany({ where: { buyerId: { in: created } } });
    await db.auditLogEntry.deleteMany({ where: { operatorId: { in: created } } });
    await db.operator.deleteMany({ where: { id: { in: created } } });
    await db.rateLimitHit.deleteMany({ where: { bucket: { in: buckets } } });
    await db.$disconnect();
  }
  console.log("\nAll abuse-limit checks passed.");
}

main().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
