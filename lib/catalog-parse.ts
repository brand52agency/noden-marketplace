// Parsing for the free prompt library files in content/prompts/<slug>.md (see docs/CATALOG_TASKS.md).
// No filesystem access here: the site reads lib/catalog-published.json (built by
// `npm run catalog:build`), and only scripts read the markdown.


export type PromptFrontmatter = {
  id: string;
  type: string;
  title: string;
  slug: string;
  category: string;
  audience: string;
  related_pack: string;
  price: string;
  status: string;
  tested: boolean;
};

export type Prompt = PromptFrontmatter & {
  purpose: string;
  fields: { name: string; help: string }[];
  prompt: string;
  example: string; // raw text of the Example output section
  exampleInputs: { name: string; value: string }[];
  exampleOutput: string;
};

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = JSON.parse(v);
    data[line.slice(0, i).trim()] = v;
  }
  return { data, body: m[2] };
}

function section(body: string, heading: string): string {
  const re = new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
  const m = re.exec(body);
  if (!m) return "";
  const rest = body.slice(m.index + m[0].length);
  const next = rest.search(/^## /m);
  return (next < 0 ? rest : rest.slice(0, next)).trim();
}

// The example is the last section and holds a model's real output, which may contain its own
// "## " headings, so read it to the end of the file rather than to the next heading.
function exampleSection(body: string): string {
  const m = /^## Example output\s*$/m.exec(body);
  return m ? body.slice(m.index + m[0].length).trim() : "";
}

const block = (s: string) => s.match(/~~~~\n([\s\S]*?)\n~~~~/)?.[1] ?? "";

function parseExample(example: string) {
  const [inputPart = "", outputPart = ""] = example.split(/^### Output\s*$/m);
  const inputs = [...inputPart.matchAll(/^\*\*\{\{(\w+)\}\}\*\*\n(~~~~\n[\s\S]*?\n~~~~)/gm)].map((m) => ({
    name: m[1],
    value: block(m[2]),
  }));
  return { inputs, output: block(outputPart) };
}

export function parsePrompt(raw: string): Prompt {
  const { data, body } = parseFrontmatter(raw);
  const example = exampleSection(body);
  const parsed = parseExample(example);
  const promptSection = section(body, "Prompt");
  const fence = promptSection.match(/```[a-z]*\n([\s\S]*?)\n```/);
  return {
    id: data.id ?? "",
    type: data.type ?? "",
    title: data.title ?? "",
    slug: data.slug ?? "",
    category: data.category ?? "",
    audience: data.audience ?? "",
    related_pack: data.related_pack ?? "",
    price: data.price ?? "",
    status: data.status ?? "",
    tested: data.tested === "true",
    purpose: section(body, "What it's for"),
    fields: section(body, "Fill in")
      .split("\n")
      .map((l) => l.match(/^- `\{\{(\w+)\}\}`:\s*(.*)$/))
      .filter((m): m is RegExpMatchArray => !!m)
      .map((m) => ({ name: m[1], help: m[2] })),
    prompt: fence ? fence[1] : "",
    example,
    exampleInputs: parsed.inputs,
    exampleOutput: parsed.output,
  };
}
