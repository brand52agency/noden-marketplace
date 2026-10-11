// Applies recorded test runs (one JSON per prompt: inputs, output, hold-the-line verdict) to the
// prompt files. Used when the runs were done by an assistant session instead of `catalog:run`.
//   npm run catalog:apply -- <results-dir> [--publish]
// A prompt moves to tested (or published with --publish) only if its run produced a real output
// for every field, it held the line, and it was judged specific. Anything else stays `drafted`
// and is listed in catalog/RUN_REPORT.md.
import fs from "node:fs";
import path from "node:path";
import { parsePrompt } from "../lib/catalog-parse";
import { buildPublished, serialize } from "./catalog-build";

const root = process.cwd();
const dir = path.join(root, "content/prompts");
const csvPath = path.join(root, "catalog/CATALOG_PLAN.csv");
const resultsDir = path.resolve(process.argv[2] ?? "");
const publish = process.argv.includes("--publish");
const fence = (s: string) => `~~~~\n${s.trim()}\n~~~~`;

type Result = {
  slug: string;
  inputs: Record<string, string>;
  output: string;
  hold_line: { pass: boolean; reason: string };
  specific: boolean;
  notes?: string;
};

const report = ["# Catalog run report", "", "| ID | Prompt | Result | Note |", "|---|---|---|---|"];
const passed: string[] = [];

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
  const file = path.join(dir, f);
  const raw = fs.readFileSync(file, "utf8");
  const p = parsePrompt(raw);
  if (p.status !== "drafted") continue;
  const rf = path.join(resultsDir, `${p.slug}.json`);
  if (!fs.existsSync(rf)) { report.push(`| ${p.id} | ${p.title} | not run | no result file |`); continue; }
  const r = JSON.parse(fs.readFileSync(rf, "utf8")) as Result;
  const problems: string[] = [];
  for (const fl of p.fields) if (!r.inputs?.[fl.name]?.trim()) problems.push(`no input for ${fl.name}`);
  if (!r.output || r.output.trim().length < 200) problems.push("output missing or too short");
  if (!r.hold_line?.pass) problems.push(`did not hold the line: ${r.hold_line?.reason ?? "?"}`);
  if (!r.specific) problems.push("judged not specific");
  if (problems.length) {
    report.push(`| ${p.id} | ${p.title} | FAIL | ${problems.join("; ").replace(/\|/g, "/")} |`);
    continue;
  }
  const example =
    `## Example output\n\n### Input used\n\n` +
    p.fields.map((fl) => `**{{${fl.name}}}**\n${fence(r.inputs[fl.name])}\n`).join("\n") +
    `\n### Output\n\n${fence(r.output)}\n`;
  const head = raw.slice(0, raw.search(/^## Example output\s*$/m));
  const to = publish ? "published" : "tested";
  fs.writeFileSync(file, (head + example).replace(/^status: drafted$/m, `status: ${to}`).replace(/^tested: false$/m, "tested: true"));
  passed.push(p.id);
  report.push(`| ${p.id} | ${p.title} | pass | ${(r.notes ?? "").replace(/\|/g, "/")} |`);
}

let csv = fs.readFileSync(csvPath, "utf8");
for (const id of passed) csv = csv.replace(new RegExp(`^(${id},.*),drafted$`, "m"), `$1,${publish ? "published" : "tested"}`);
fs.writeFileSync(csvPath, csv);
fs.writeFileSync(path.join(root, "lib/catalog-published.json"), serialize(buildPublished(dir)));
fs.writeFileSync(path.join(root, "catalog/RUN_REPORT.md"), report.join("\n") + "\n");
console.log(`${passed.length} applied (${publish ? "published" : "tested"}). See catalog/RUN_REPORT.md`);
