// One-off, idempotent: rewrite legacy order statuses to the new set (pending / completed / failed / refunded).
// Run: npx tsx scripts/migrate-order-states.ts [--dry-run]
// The app reads both spellings (lib/order-status.ts), so this is cleanup, not a prerequisite.
import { db } from "../lib/db";

const MAP: [string[], string][] = [
  [["pending_payment", "paid", "delivered"], "pending"],
  [["settled", "verified"], "completed"],
  [["disputed"], "failed"],
];

async function main() {
  const dry = process.argv.includes("--dry-run");
  for (const [from, to] of MAP) {
    const n = await db.order.count({ where: { status: { in: from } } });
    console.log(`${from.join("/")} -> ${to}: ${n} order(s)${dry ? " (dry run)" : ""}`);
    if (!dry && n > 0) await db.order.updateMany({ where: { status: { in: from } }, data: { status: to } });
  }
  const left = await db.order.groupBy({ by: ["status"], _count: true });
  console.log("statuses now:", Object.fromEntries(left.map((r) => [r.status, r._count])));
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
