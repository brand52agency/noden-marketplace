// What the site shows: the published prompts, from lib/catalog-published.json. That file is built
// from content/prompts/*.md by `npm run catalog:build` and checked by `npm run catalog:check`, so
// the site needs no filesystem access at runtime. Only items with `status: published` are in it.
import data from "./catalog-published.json";
import { slugify, type Prompt } from "./catalog-parse";

export const SITE = "https://shop.getnoden.com";

const prompts = data as Prompt[];

export const publishedPrompts = () => prompts;

export function promptCategories() {
  const by = new Map<string, Prompt[]>();
  for (const p of prompts) by.set(p.category, [...(by.get(p.category) ?? []), p]);
  return [...by.entries()].map(([name, items]) => ({ name, slug: slugify(name), items }));
}

export const getPrompt = (slug: string) => prompts.find((p) => p.slug === slug) ?? null;
export const getCategory = (slug: string) => promptCategories().find((c) => c.slug === slug) ?? null;
