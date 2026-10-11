// purchase_skill takes the key from the Authorization header when api_key is not passed.
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { db } from "../lib/db";
import { createMcpServer } from "../lib/mcp-server";
import { registerSelfServeOperator } from "../lib/marketplace";

const text = (r: unknown) => (r as { content: { text: string }[] }).content[0].text;

async function connect(headers: Record<string, string>) {
  const server = createMcpServer({ headers: { get: (n: string) => headers[n.toLowerCase()] ?? null } });
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "t", version: "1" });
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}

async function main() {
  const listing = await db.listing.findFirst({ where: { active: true, priceSats: 0, handler: { not: null } } });
  if (!listing) { console.log("SKIP no free skill listed yet"); return; }
  const { api_key } = await registerSelfServeOperator();
  const opId = (await db.operator.findFirstOrThrow({ orderBy: { createdAt: "desc" } })).id;
  const input = { url: "https://example.com" };
  try {
    const withHeader = await connect({ authorization: `Bearer ${api_key}`, "x-forwarded-for": "198.51.100.200" });
    const ok = JSON.parse(text(await withHeader.callTool({ name: "purchase_skill", arguments: { skill_id: listing.id, input } })));
    assert.equal(ok.free_skill, true);
    console.log("PASS key from the Authorization header works with no api_key argument");

    const withArg = await connect({ "x-forwarded-for": "198.51.100.200" });
    const ok2 = JSON.parse(text(await withArg.callTool({ name: "purchase_skill", arguments: { skill_id: listing.id, input, api_key } })));
    assert.equal(ok2.free_skill, true);
    console.log("PASS api_key argument still works");

    const none = await connect({});
    assert.match(text(await none.callTool({ name: "purchase_skill", arguments: { skill_id: listing.id, input } })), /API key is required/);
    const bad = await connect({ authorization: "Bearer agx_" + "0".repeat(48) });
    assert.match(text(await bad.callTool({ name: "purchase_skill", arguments: { skill_id: listing.id, input } })), /invalid API key/);
    console.log("PASS no key -> clear error; wrong key -> rejected");
  } finally {
    await db.order.deleteMany({ where: { buyerId: opId } });
    await db.auditLogEntry.deleteMany({ where: { operatorId: opId } });
    await db.rateLimitHit.deleteMany({ where: { OR: [{ bucket: { startsWith: "freeskill:" } }, { bucket: { startsWith: "register:" } }] } });
    await db.operator.delete({ where: { id: opId } });
    await db.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
