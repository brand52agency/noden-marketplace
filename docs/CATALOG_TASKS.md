# Noden catalog: 300 items

Tasks for Claude Code. Copy this folder into the repo root. It works alongside `NODEN_PRICING_TASKS.md` (workstreams D and E) and does not replace it.

## What is here

| Path | What it is |
|---|---|
| `catalog/CATALOG_PLAN.csv` | The plan: 300 rows, one per item |
| `content/prompts/` | The first 24 free prompts, written and ready to test |
| `CATALOG_TASKS.md` | This file: templates, quality rules, and how to build and publish the rest |

## The 300

| Type | Count | Price | Where it lives |
|---|---|---|---|
| Free prompt | 200 | Free | `/prompts/<slug>`, eight categories of 25 |
| Pack template | 60 | Sold inside ten packs, $19 to $39 | `/packs/<pack>`, six templates per pack |
| Agent recipe | 30 | Free to read; runs paid skills | `/recipes/<slug>` |
| Skill | 10 | Three free, seven priced above cost | The shop |

Columns in the plan: `id`, `type`, `category`, `title`, `slug`, `audience`, `related_pack`, `price`, `uses_or_source`, `wave`, `status`.

`status` moves through: `planned` → `drafted` → `tested` → `published`. Update the CSV as items move. It is the single source of truth for what exists.

## Rules for every item

1. **One file per item**, named by its `slug`, with the frontmatter shown in the templates below.
2. **No invented facts.** No statistics, testimonials, customer counts or results. Prompts must instruct the model not to invent them either.
3. **Each item must be tested before it is published** (see "Quality gate").
4. **Example outputs come from a real run**, pasted in. Never written by hand.
5. **Plain language.** A non-technical reader should understand what the item does from its title and first line.
6. **No duplicates.** Before writing an item, check the plan for one that does the same job. If two overlap, merge them and note it in the PR.
7. **Do not write the 60 pack templates or publish packs until the owner approves pack prices.**

## Templates

### Free prompt (`content/prompts/<slug>.md`)

```
---
id: N000
type: prompt
title: ""
slug:
category:
audience:
related_pack:
price: free
status: drafted
tested: false
---

## What it's for
One sentence: the outcome for the reader.

## Fill in
- `{{field}}`: what to put here

## Prompt
(fenced block containing the prompt, with {{fields}})

## Example output
Real output from a test run.
```

A good prompt here:
- Asks for two to five inputs, no more.
- States the output format exactly.
- Has a "Rules" section that forbids inventing facts and tells the model what placeholder to use when information is missing.
- Ends by asking the model to flag what the user still needs to check or supply.

The 24 files in `content/prompts/` are the reference for tone and structure.

### Pack template (`content/packs/<pack-slug>/<slug>.md`)

Same frontmatter, with `type: pack-template` and `pack:`. A pack template is longer than a free prompt: it is a multi-step workflow with a setup step, the working prompts, a fill-in worksheet or table, and a "how to reuse this each week" section. Each pack also needs a `README.md` and one template marked `sample: true` that is shown free on the pack page.

### Agent recipe (`content/recipes/<slug>.md`)

```
---
id: N000
type: recipe
title: ""
slug:
skills_used: []
status: drafted
tested: false
---

## What it does
## What you need
## Steps
Numbered. For each step: which skill is called, the input, what comes back.
## Cost per run
In credits, summed from the skills' real prices.
## Copy-paste instructions for your agent
A block an agent can follow.
## Example run
Real input and output.
```

A recipe may only name skills that are live in the shop. If a skill in `uses_or_source` is not live, the recipe stays `planned`.

### Skill

Skills are listings in the shop database, not markdown files. For each of the ten in the plan:

- Define input and output JSON schemas.
- Implement against the real source named in `uses_or_source`. A skill whose name implies a lookup must perform that lookup. No model-generated stand-ins.
- Apply the URL and upload safety rules in `NODEN_PRICING_TASKS.md` D3 and F.
- Measure cost per call and set the credit price above it. The three free skills stay free.
- Add through an import script that validates the schemas and runs a test call before the listing is made active.

## Quality gate

An item moves to `tested` only when all of these pass:

- **It runs.** Executed once with a realistic input. The output is saved as the example.
- **It is specific.** The output could not have come from a one-line request. If asking a model "write me a welcome email" gives a result just as good, rewrite or cut the item.
- **It holds the line.** Given an input with missing information, it uses a placeholder or asks, and does not make things up.
- **It reads cleanly.** Title under 60 characters, no jargon, no hype words.
- **It is unique** within the catalog.

Record pass or fail per item in the PR. Cut items that fail twice and mark them `cut` in the CSV. A smaller catalog of good items is the goal; 300 is a ceiling, not a quota.

## Build order

Follow the `wave` column.

| Wave | Items | Contents |
|---|---|---|
| 1 | 45 | The 24 written prompts, the first three packs, the three free skills |
| 2 | 56 | 48 prompts, 8 recipes |
| 3 | 83 | 48 prompts, four more packs, 8 recipes, 3 skills |
| 4 | 59 | 48 prompts, 8 recipes, 3 skills |
| 5 | 57 | 32 prompts, the last three packs, 6 recipes, 1 skill |

For each wave:
1. Write the items for that wave from the plan and templates, one category at a time.
2. Run the quality gate.
3. Update `status` in the CSV.
4. Open one PR per wave with the pass and fail list.
5. Publish only after the owner has reviewed a sample of at least five items from the wave.

Publish one wave per week.

## Site work

- Build `/prompts`, `/prompts/<category>` and `/prompts/<slug>` from `content/prompts/`. Each prompt page has a copy button, the fill-in fields, the example output, and a link to the related pack. Only items with `status: published` are shown.
- Build `/recipes` the same way.
- Packs follow `NODEN_PRICING_TASKS.md` E.
- Add all published pages to the sitemap and `llms.txt`. Add `HowTo` or `CreativeWork` JSON-LD where it fits.
- A `scripts/catalog-check` command that validates every content file against its template, checks the CSV and the files agree, and fails on duplicates or missing examples.

## Existing shop listings

The shop currently has 173 listings. Before adding the seven new paid skills, apply `NODEN_FIXES.md` 3.2: hide listings that a model does unaided with no outside data. Several current listings overlap with free prompts in this plan (for example commit messages, summaries, review drafts). Where a free prompt does the same job, retire the listing.

## Measure and prune

Track per item: page views, copies, runs, pack clicks, purchases. After a wave has been live for 30 days, list the bottom fifth by use and propose rewriting or removing them.

## Decisions for Cody

1. **Pack prices and the ten pack themes.** Default: as in the plan.
2. **Seven paid skills: which data providers to use,** and their cost. Each needs an account and may have its own fees and terms. Default: build the three free skills first and bring provider options for the rest.
3. **Review before publishing.** Default: owner reviews five items per wave.
4. **Which existing listings to retire.** Default: propose a list, change nothing until approved.
