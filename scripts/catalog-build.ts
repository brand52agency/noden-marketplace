// Builds lib/catalog-published.json (what the site serves) from content/prompts/*.md.
//   npm run catalog:build
//   npm run catalog:build -- --dir <fixtures> --out <file>   (for tests)
import fs from "node:fs";
import path from "node:path";
import { parsePrompt } from "../lib/catalog-parse";

export function buildPublished(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parsePrompt(fs.readFileSync(path.join(dir, f), "utf8")))
    .filter((p) => p.status === "published")
    .sort((a, b) => a.id.localeCompare(b.id));
}

export const serialize = (items: unknown[]) => JSON.stringify(items, null, 2) + "\n";

if (process.argv[1]?.endsWith("catalog-build.ts")) {
  const a = process.argv.slice(2);
  const arg = (k: string, d: string) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
  const dir = path.resolve(arg("--dir", "content/prompts"));
  const out = path.resolve(arg("--out", "lib/catalog-published.json"));
  const items = buildPublished(dir);
  fs.writeFileSync(out, serialize(items));
  console.log(`catalog-build: ${items.length} published prompt(s) -> ${path.relative(process.cwd(), out)}`);
}
