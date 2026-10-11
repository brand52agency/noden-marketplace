// Validates content/prompts against the template and the plan CSV.
// Fails on: missing/mismatched frontmatter, files not in the plan, a status that disagrees with the
// plan, duplicate ids/slugs/titles, missing sections, placeholder example output on any item past
// `drafted`, and slugs that collide with a category page. Run: npm run catalog:check
import fs from "node:fs";
import path from "node:path";
import { parsePrompt, slugify } from "../lib/catalog-parse";
import { buildPublished, serialize } from "./catalog-build";

const root = process.cwd();
const csv = fs.readFileSync(path.join(root, "catalog/CATALOG_PLAN.csv"), "utf8");

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...rest] = rows;
  return rest.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

const plan = parseCsv(csv);
const byId = new Map(plan.map((r) => [r.id, r]));
const errors: string[] = [];
const err = (m: string) => errors.push(m);
const ORDER = ["planned", "drafted", "tested", "published"];

const ids = new Set<string>(), slugs = new Set<string>(), titles = new Set<string>();
for (const r of plan) {
  if (ids.has(r.id)) err(`plan: duplicate id ${r.id}`);
  if (slugs.has(r.slug)) err(`plan: duplicate slug ${r.slug}`);
  ids.add(r.id); slugs.add(r.slug);
  if (r.title.length >= 60 && r.type === "free prompt") err(`plan ${r.id}: title is ${r.title.length} chars, must be under 60`);
}

const dir = path.join(root, "content/prompts");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
const categorySlugs = new Set(plan.filter((r) => r.type === "free prompt").map((r) => slugify(r.category)));
const seen = new Set<string>();

for (const f of files) {
  const p = parsePrompt(fs.readFileSync(path.join(dir, f), "utf8"));
  const where = `${f}`;
  if (f !== `${p.slug}.md`) err(`${where}: filename must be <slug>.md`);
  const row = byId.get(p.id);
  if (!row) { err(`${where}: id ${p.id} not in the plan`); continue; }
  if (row.type !== "free prompt") err(`${where}: plan says ${row.id} is a ${row.type}`);
  if (row.slug !== p.slug) err(`${where}: slug differs from plan (${row.slug})`);
  if (row.title !== p.title) err(`${where}: title differs from plan`);
  if (row.category !== p.category) err(`${where}: category differs from plan`);
  if (row.status !== p.status) err(`${where}: status "${p.status}" but plan says "${row.status}"`);
  if (seen.has(p.id)) err(`${where}: duplicate id`);
  seen.add(p.id);
  if (titles.has(p.title.toLowerCase())) err(`${where}: duplicate title`);
  titles.add(p.title.toLowerCase());
  if (categorySlugs.has(p.slug)) err(`${where}: slug collides with a category page`);
  if (p.title.length >= 60) err(`${where}: title must be under 60 characters`);
  if (!p.purpose) err(`${where}: missing "What it's for"`);
  if (!p.prompt) err(`${where}: missing fenced prompt`);
  if (!/^Rules:/m.test(p.prompt)) err(`${where}: prompt has no Rules section`);
  if (p.fields.length < 1 || p.fields.length > 5) err(`${where}: needs 1-5 fill-in fields (has ${p.fields.length})`);
  const used = new Set([...p.prompt.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
  for (const fl of p.fields) if (!used.has(fl.name)) err(`${where}: field {{${fl.name}}} listed but not used in the prompt`);
  for (const u of used) if (!p.fields.some((fl) => fl.name === u)) err(`${where}: {{${u}}} used but not listed under Fill in`);
  const rank = ORDER.indexOf(p.status);
  if (rank < 0) err(`${where}: unknown status "${p.status}"`);
  if (rank >= 2 && !p.tested) err(`${where}: status ${p.status} requires tested: true`);
  if (rank >= 2 && (!p.exampleOutput || /^TODO/m.test(p.example))) err(`${where}: missing real example output`);
  if (rank < 2 && p.tested) err(`${where}: tested: true but status is ${p.status}`);
}
for (const r of plan) {
  if (r.type === "free prompt" && ["drafted", "tested", "published"].includes(r.status) && !seen.has(r.id))
    err(`plan ${r.id}: status ${r.status} but no file in content/prompts`);
}

const jsonPath = path.join(root, "lib/catalog-published.json");
if (!fs.existsSync(jsonPath) || fs.readFileSync(jsonPath, "utf8") !== serialize(buildPublished(dir)))
  err("lib/catalog-published.json is out of date: run `npm run catalog:build`");

const count = (s: string) => files.filter((f) => f.endsWith(".md")).length && plan.filter((r) => r.status === s).length;
if (errors.length) {
  console.error(`catalog-check FAILED (${errors.length}):\n` + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
console.log(`catalog-check OK: ${plan.length} planned, ${files.length} prompt files; published ${count("published")}`);
