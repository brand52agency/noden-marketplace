// One-off, idempotent: hash every plaintext API key still in the database, then null the plaintext.
// Run: npx tsx scripts/migrate-api-keys.ts [--dry-run]
// Legacy keys also upgrade themselves the first time they are used, so this is cleanup. After it,
// nobody (including us) can read any key; owners regenerate from the dashboard if they lose one.
import { db } from "../lib/db";
import { apiKeyFields } from "../lib/api-key";

async function main() {
  const dry = process.argv.includes("--dry-run");
  const legacy = await db.operator.findMany({ where: { apiKey: { not: null } }, select: { id: true, email: true, apiKey: true } });
  console.log(`${legacy.length} operator(s) still hold a plaintext key${dry ? " (dry run)" : ""}`);
  for (const o of legacy) {
    if (dry) continue;
    await db.operator.update({ where: { id: o.id }, data: { ...apiKeyFields(o.apiKey!), apiKey: null } });
  }
  const left = await db.operator.count({ where: { apiKey: { not: null } } });
  const hashed = await db.operator.count({ where: { apiKeyHash: { not: null } } });
  console.log(`plaintext keys left: ${left} | hashed keys: ${hashed}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
