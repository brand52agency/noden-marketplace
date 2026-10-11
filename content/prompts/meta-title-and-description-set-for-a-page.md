---
id: N077
type: prompt
title: "Meta title and description set for a page"
slug: meta-title-and-description-set-for-a-page
category: SEO and content
audience: Marketers and site owners
related_pack: SEO Content Pack
price: free
status: published
tested: true
---

## What it's for
Write the snippet people see in search results.

## Fill in
- `{{page}}`: the page content or a summary
- `{{keyword}}`: the main phrase for this page
- `{{brand}}`: your business name

## Prompt

```
Write search snippets for this page.

Page content:
{{page}}

Main keyword: {{keyword}}
Brand: {{brand}}

Give me five pairs of meta title and meta description.

Rules:
- Titles under 60 characters, descriptions under 155. Show the count for each.
- Use the keyword naturally in the title, near the start where it reads well.
- Each description states what the visitor will find and one reason to choose this page. It must match the page content.
- No all-caps and no claims the page does not support.
- Recommend one pair and explain the choice in one sentence.
- If the page content does not match the keyword's likely intent, tell me before writing.
```

## Example output

### Input used

**{{page}}**
~~~~
Gutter Cleaning in Spokane Valley (Clearflow Gutter Co.). Flat-rate gutter cleaning for homes in Spokane Valley, Liberty Lake and Millwood. Prices start at $149 for single-story homes under 2,000 sq ft and $219 for two-story homes. Every visit includes hand-clearing of all gutters, a downspout flush, and before-and-after photos sent to your phone. Book online in about two minutes, no contract, pay after the work is done. Owner-operated and fully insured. Most appointments are available within the same week. FAQ covers how often to clean (twice a year for homes near pines), what we do about moss, and what happens if it rains on your appointment day.
~~~~

**{{keyword}}**
~~~~
gutter cleaning Spokane Valley
~~~~

**{{brand}}**
~~~~
Clearflow Gutter Co.
~~~~

### Output

~~~~
**Pair 1**
Title: Gutter Cleaning Spokane Valley | Clearflow Gutter Co. (53 characters)
Description: Flat-rate gutter cleaning in Spokane Valley from $149. Hand-cleared gutters, flushed downspouts, photos after, and online booking with no contract. (147 characters)

**Pair 2**
Title: Gutter Cleaning in Spokane Valley, From $149 | Clearflow (56 characters)
Description: See flat prices by house size, what each visit includes, and how to book. Insured, owner-operated gutter cleaning for Spokane Valley homes. (139 characters)

**Pair 3**
Title: Spokane Valley Gutter Cleaning: Flat Rates | Clearflow (54 characters)
Description: Cleared gutters and flushed downspouts at a flat price, with photos when we finish. Book online in Spokane Valley, Liberty Lake or Millwood. (140 characters)

**Pair 4**
Title: Gutter Cleaning Spokane Valley | Owner-Operated (47 characters)
Description: Clearflow Gutter Co. is an insured, owner-operated team clearing gutters by hand across Spokane Valley. Flat prices, no contract, pay after the work. (149 characters)

**Pair 5**
Title: Gutter Cleaning Spokane Valley: Book Online | Clearflow (55 characters)
Description: Book gutter cleaning in Spokane Valley online. Prices from $149, with hand-clearing and a downspout flush included. Most visits fit within the same week. (153 characters)

**Recommendation:** Pair 1, because it leads with the exact keyword, includes the brand, and its description names the price, what is included, and the no-contract booking, all of which the page supports.
~~~~
