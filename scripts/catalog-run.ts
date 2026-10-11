// Runs each drafted free prompt for real, so the example output on the page is a genuine model
// run (docs/CATALOG_TASKS.md rule 4), and applies the "holds the line" check by re-running the prompt
// with one input left empty and having a judge model confirm nothing was invented.
//
//   npm run catalog:run                 # every prompt with status: drafted
//   npm run catalog:run -- --slug x     # one prompt
//   npm run catalog:run -- --publish    # also move prompts that passed to status: published
//
// Writes catalog/RUN_REPORT.md. Prompts that fail stay `drafted`. Costs a few cents per prompt.
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { parsePrompt, type Prompt } from "../lib/catalog-parse";
import { buildPublished, serialize } from "./catalog-build";

const MODEL = "claude-sonnet-5-5";
const JUDGE = "claude-haiku-4-5-20251001";
const root = process.cwd();
const dir = path.join(root, "content/prompts");
const csvPath = path.join(root, "catalog/CATALOG_PLAN.csv");
const args = process.argv.slice(2);
const only = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
const publish = args.includes("--publish");

for (const l of fs.readFileSync(path.join(root, ".env"), "utf8").split("\n")) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const client = new Anthropic();

const text = async (model: string, content: string, max = 2500) => {
  const r = await client.messages.create({ model, max_tokens: max, messages: [{ role: "user", content }] });
  return r.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
};
const fill = (tpl: string, v: Record<string, string>) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? "");

async function sampleInputs(p: Prompt): Promise<Record<string, string>> {
  const out = await text(
    MODEL,
    `Make up realistic sample inputs for a prompt template titled "${p.title}" (for ${p.audience}).
Use a plausible FICTIONAL small business or person (no real brands, no real people). Be concrete and specific, the way a real user would type it, with realistic length (a "draft post" is a full paragraph, a "call notes" field is several lines).
Fields:
${p.fields.map((f) => `- ${f.name}: ${f.help}`).join("\n")}

Return ONLY a JSON object mapping each field name to a string value.`,
  );
  const json = out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1);
  const v = JSON.parse(json) as Record<string, unknown>;
  return Object.fromEntries(p.fields.map((f) => [f.name, String(v[f.name] ?? "")]));
}

async function judge(p: Prompt, given: Record<string, string>, blank: string, output: string) {
  const out = await text(
    JUDGE,
    `A prompt template was run with one input deliberately left EMPTY: "${blank}".
Inputs actually provided:
${JSON.stringify(given, null, 2)}

The model's response:
"""
${output}
"""

Did the response HOLD THE LINE? It passes only if it (a) asks for the missing information, or (b) uses a clearly marked placeholder (like [your price]) wherever the missing information would go, or (c) says what is missing, AND it does not invent specific facts for the missing input (names, numbers, prices, dates, statistics, results, quotes). Reasonable writing built only from the provided inputs is fine.
Reply with ONLY JSON: {"pass": true|false, "reason": "<one sentence>"}`,
    300,
  );
  return JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1)) as { pass: boolean; reason: string };
}

const fence = (s: string) => `~~~~\n${s.trim()}\n~~~~`;

async function main() {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const report: string[] = ["# Catalog run report", "", `Model for examples: ${MODEL}. Judge: ${JUDGE}.`, "", "| ID | Prompt | Runs | Holds the line | Note |", "|---|---|---|---|---|"];
  const passed: string[] = [];

  for (const f of files) {
    const file = path.join(dir, f);
    const raw = fs.readFileSync(file, "utf8");
    const p = parsePrompt(raw);
    if (only && p.slug !== only) continue;
    if (p.status !== "drafted") continue;
    process.stdout.write(`${p.id} ${p.slug} ... `);
    try {
      const inputs = await sampleInputs(p);
      const output = await text(MODEL, fill(p.prompt, inputs));
      if (output.length < 200) throw new Error("output suspiciously short");

      // Holds-the-line: blank the last field and run again.
      const blank = p.fields[p.fields.length - 1].name;
      const sparse = { ...inputs, [blank]: "" };
      const sparseOut = await text(MODEL, fill(p.prompt, sparse));
      const verdict = await judge(p, sparse, blank, sparseOut);

      if (verdict.pass) {
        const example =
          `## Example output\n\n### Input used\n\n` +
          p.fields.map((fl) => `**{{${fl.name}}}**\n${fence(inputs[fl.name])}\n`).join("\n") +
          `\n### Output\n\n${fence(output)}\n`;
        const head = raw.slice(0, raw.search(/^## Example output\s*$/m));
        let next = head + example;
        next = next.replace(/^status: drafted$/m, "status: tested").replace(/^tested: false$/m, "tested: true");
        fs.writeFileSync(file, next);
        passed.push(p.id);
      }
      console.log(verdict.pass ? "pass" : `FAIL (${verdict.reason})`);
      report.push(`| ${p.id} | ${p.title} | yes | ${verdict.pass ? "pass" : "FAIL"} | ${verdict.reason.replace(/\|/g, "/")} |`);
    } catch (e) {
      console.log("ERROR", (e as Error).message);
      report.push(`| ${p.id} | ${p.title} | error | - | ${(e as Error).message.replace(/\|/g, "/").slice(0, 120)} |`);
    }
  }

  // Keep the plan CSV in step with the files.
  if (passed.length) {
    const to = publish ? "published" : "tested";
    let csv = fs.readFileSync(csvPath, "utf8");
    for (const id of passed) csv = csv.replace(new RegExp(`^(${id},.*),drafted$`, "m"), `$1,${to}`);
    fs.writeFileSync(csvPath, csv);
    if (publish) {
      for (const f of files) {
        const file = path.join(dir, f);
        const raw = fs.readFileSync(file, "utf8");
        if (passed.some((id) => raw.includes(`id: ${id}\n`))) fs.writeFileSync(file, raw.replace(/^status: tested$/m, "status: published"));
      }
    }
  }
  fs.writeFileSync(path.join(root, "lib/catalog-published.json"), serialize(buildPublished(dir)));
  fs.writeFileSync(path.join(root, "catalog/RUN_REPORT.md"), report.join("\n") + "\n");
  console.log(`\n${passed.length} passed. Report: catalog/RUN_REPORT.md`);
}
main();
