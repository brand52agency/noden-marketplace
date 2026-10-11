// Computes every active listing's credit price from the cost model in lib/credits.ts, writes
// lib/credit-prices.json (the snapshot buyers see) and docs/credit-pricing.md (the margin report).
// Run: npm run credits:generate        Check only (no writes): npm run credits:generate -- --check
import fs from "node:fs";
import path from "node:path";
import { db } from "../lib/db";
import {
  MAX_INPUT_CHARS,
  MIN_TYPICAL_MARGIN,
  MIN_WORST_CASE_MARGIN,
  MIN_CREDITS_PER_CALL,
  NET_FLOOR_USD_PER_CREDIT,
  PLAN_ECONOMICS,
  REFERENCE_USD_PER_BTC,
  creditBreakdown,
  netUsdPerCredit,
  schemaMaxInputChars,
  snapshotHasListing,
} from "../lib/credits";

const cents = (usd: number) => `${(usd * 100).toFixed(2)}¢`;
const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

async function main() {
  const check = process.argv.includes("--check");
  const listings = await db.listing.findMany({
    where: { active: true },
    orderBy: [{ priceSats: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, priceSats: true, details: true, description: true, inputSchema: true, outputSchema: true },
  });

  const rows = listings.map((l) => ({ l, b: creditBreakdown(l), unbounded: !Number.isFinite(schemaMaxInputChars(l.inputSchema)) }));
  const problems: string[] = [];
  for (const { l, b } of rows) {
    if (b.credits < MIN_CREDITS_PER_CALL) problems.push(`${l.name}: below minimum credits`);
    if (b.worstCaseMargin < MIN_WORST_CASE_MARGIN - 1e-9) problems.push(`${l.name}: worst-case margin ${pct(b.worstCaseMargin)} < ${pct(MIN_WORST_CASE_MARGIN)}`);
    if (b.typicalMargin < MIN_TYPICAL_MARGIN) problems.push(`${l.name}: typical margin ${pct(b.typicalMargin)} < ${pct(MIN_TYPICAL_MARGIN)}`);
  }

  if (check) {
    for (const { l } of rows) if (!snapshotHasListing(l.id)) problems.push(`${l.name}: not in lib/credit-prices.json (run npm run credits:generate)`);
  }

  const dist = new Map<number, number>();
  rows.forEach(({ b }) => dist.set(b.credits, (dist.get(b.credits) ?? 0) + 1));
  const worstMargin = Math.min(...rows.map((r) => r.b.worstCaseMargin));
  const typMargin = Math.min(...rows.map((r) => r.b.typicalMargin));
  const maxWorst = Math.max(...rows.map((r) => r.b.worstCaseCostUsd));
  const maxTypical = Math.max(...rows.map((r) => r.b.typicalCostUsd));
  const costDriven = rows.filter((r) => r.b.fromWorstCase > Math.max(r.b.fromSats, MIN_CREDITS_PER_CALL));

  console.log(`${listings.length} listings | credit prices ${Math.min(...rows.map((r) => r.b.credits))}–${Math.max(...rows.map((r) => r.b.credits))}`);
  console.log(`revenue floor: ${cents(NET_FLOOR_USD_PER_CREDIT)} net per credit (cheapest credit Noden sells, after card fees, −5%)`);
  console.log(`worst-case call cost: up to ${cents(maxWorst)} | typical: up to ${cents(maxTypical)}`);
  console.log(`lowest margins at the floor: worst-case ${pct(worstMargin)}, typical ${pct(typMargin)}`);
  console.log(`priced up for cost (rule 3 binding): ${costDriven.length}`);
  console.log("credits distribution:", [...dist.entries()].sort((a, b) => a[0] - b[0]).map(([c, n]) => `${c}cr×${n}`).join(" "));
  if (problems.length) {
    console.error(`\n${problems.length} PROBLEMS:\n- ` + problems.join("\n- "));
    process.exitCode = 1;
  } else {
    console.log("\nOK: every listing meets the minimum-credit, worst-case and typical margin rules.");
  }
  if (check) {
    await db.$disconnect();
    return;
  }

  const snapshot = {
    referenceUsdPerBtc: REFERENCE_USD_PER_BTC,
    generatedAt: new Date().toISOString().slice(0, 10),
    prices: Object.fromEntries(rows.map(({ l, b }) => [l.id, b.credits])),
  };
  fs.writeFileSync(path.join(__dirname, "../lib/credit-prices.json"), JSON.stringify(snapshot, null, 1) + "\n");

  const md: string[] = [
    "# Credit pricing and unit economics",
    "",
    `Generated ${snapshot.generatedAt} by \`npm run credits:generate\` from the live catalog (${listings.length} active listings). Do not edit by hand.`,
    "",
    "## How a credit price is set",
    "",
    "1 credit = $0.01 of marketplace spend. A listing's credits are the **highest** of:",
    "",
    `1. its sats price at a fixed reference rate ($${REFERENCE_USD_PER_BTC.toLocaleString()} per BTC, rounded up);`,
    `2. the minimum of ${MIN_CREDITS_PER_CALL} credits per call;`,
    `3. enough credits that the **worst allowed call** still keeps ${pct(MIN_WORST_CASE_MARGIN)} gross margin at the cheapest credit Noden sells.`,
    "",
    "Rule 3 only holds because `createOrder` rejects any input over " + MAX_INPUT_CHARS.toLocaleString() + " characters (and any request body over 100 KB) before a model is called.",
    "",
    "## What a call costs Noden",
    "",
    "Fulfillment is one Claude Haiku 4.5 call with a forced tool call ($1 per million input tokens, $5 per million output tokens). Output is capped at 2,048 tokens, so output can never cost more than 1.02¢. Estimates use 3 characters per token (conservative), 580 fixed prompt tokens, the listing's own prompt and output schema, and a typical input of 1,500 characters.",
    "",
    `- Typical call: up to **${cents(maxTypical)}** across the catalog.`,
    `- Worst allowed call (max input, max output): up to **${cents(maxWorst)}**.`,
    "",
    "## What Noden earns per credit",
    "",
    "| Credit source | Price | Credits | Gross per credit | Net per credit (after card fees) |",
    "|---|---|---|---|---|",
    ...PLAN_ECONOMICS.map((e) => `| ${e.name} | $${e.usd} | ${e.credits.toLocaleString()} | ${cents(e.usd / e.credits)} | ${cents(netUsdPerCredit(e))} |`),
    "",
    `Cheapest net credit is ${cents(Math.min(...PLAN_ECONOMICS.map(netUsdPerCredit)))}. Pricing assumes **${cents(NET_FLOOR_USD_PER_CREDIT)}** (5% lower, for tax, refunds and chargebacks). Card fees are 2.9% + 30¢ plus ~0.7% Stripe Billing; Lightning has no meaningful fee.`,
    "",
    "## Result",
    "",
    `- Credit prices range ${Math.min(...rows.map((r) => r.b.credits))}–${Math.max(...rows.map((r) => r.b.credits))} credits. Distribution: ${[...dist.entries()].sort((a, b) => a[0] - b[0]).map(([c, n]) => `${c} credits × ${n}`).join(", ")}.`,
    `- Lowest margin at the floor: **${pct(worstMargin)}** on the worst possible call, **${pct(typMargin)}** on a typical call.`,
    `- ${costDriven.length} listings are priced above their sats-derived price because of cost.`,
    "",
    "## Per listing",
    "",
    "| Listing | Category | Sats | Credits | Typical cost | Worst-case cost | Typical margin | Worst margin | Input bounded by schema |",
    "|---|---|---|---|---|---|---|---|---|",
    ...rows.map(({ l, b, unbounded }) => `| ${l.name} | ${l.category} | ${l.priceSats} | ${b.credits} | ${cents(b.typicalCostUsd)} | ${cents(b.worstCaseCostUsd)} | ${pct(b.typicalMargin)} | ${pct(b.worstCaseMargin)} | ${unbounded ? "no (capped)" : "yes"} |`),
    "",
  ];
  fs.writeFileSync(path.join(__dirname, "../docs/credit-pricing.md"), md.join("\n"));
  console.log("\nwrote lib/credit-prices.json and docs/credit-pricing.md");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
