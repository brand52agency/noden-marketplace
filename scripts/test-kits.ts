// Kit definitions (no database needed) and, with --db, ownership: one claim per account, nobody else's.
//   npm run test:kits            definitions only
//   npm run test:kits -- --db    also checks claims against the database (needs the KitClaim table)
import { randomBytes } from "crypto";
import { KITS, MCP_URL, getKit, kitHandlersExist, kitMarkdown, isFreeKit, type KitSkillView } from "../lib/kits";

let failed = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
  if (!ok) failed++;
};

async function main() {
  check("kit ids are unique", new Set(KITS.map((k) => k.id)).size === KITS.length);
  for (const kit of KITS) {
    check(`${kit.id}: every skill has a code handler`, kitHandlersExist(kit));
    check(`${kit.id}: has instructions and starter tasks`, kit.instructions.length > 200 && kit.starterTasks.length >= 3);
    check(`${kit.id}: no skill listed twice`, new Set(kit.skills.map((s) => s.handler)).size === kit.skills.length);
    const views: KitSkillView[] = kit.skills.map((s) => ({ ...s, listingId: "lst_1", name: s.handler, credits: 5 }));
    const md = kitMarkdown(kit, views);
    check(`${kit.id}: setup file has the connect address and instructions`, md.includes(MCP_URL) && md.includes(kit.instructions));
    check(`${kit.id}: setup file never contains an API key`, !/noden_[a-z0-9]{16,}/i.test(md) && !/sk_(live|test)_/.test(md));
  }
  check("getKit finds a kit and rejects an unknown id", getKit("website-care") !== null && getKit("nope") === null);
  check("the Website Care Kit is free", isFreeKit(getKit("website-care")!));

  if (process.argv.includes("--db")) {
    const { db } = await import("../lib/db");
    const tag = randomBytes(4).toString("hex");
    const mk = (l: string) => db.operator.create({ data: { email: `kits-test-${l}-${tag}@noden.internal`, passwordHash: "x" } });
    const [a, b] = await Promise.all([mk("a"), mk("b")]);
    try {
      const key = { operatorId_kitId: { operatorId: a.id, kitId: "website-care" } };
      await db.kitClaim.upsert({ where: key, update: {}, create: { operatorId: a.id, kitId: "website-care" } });
      await db.kitClaim.upsert({ where: key, update: {}, create: { operatorId: a.id, kitId: "website-care" } });
      check("claiming twice leaves one row", (await db.kitClaim.count({ where: { operatorId: a.id } })) === 1);
      check("another account does not own it", (await db.kitClaim.count({ where: { operatorId: b.id } })) === 0);
    } finally {
      await db.kitClaim.deleteMany({ where: { operatorId: { in: [a.id, b.id] } } });
      await db.operator.deleteMany({ where: { id: { in: [a.id, b.id] } } });
      await db.$disconnect();
    }
  }

  console.log(failed ? `\n${failed} FAILED` : "\nall passed");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
