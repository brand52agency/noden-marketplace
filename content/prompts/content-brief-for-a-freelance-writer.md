---
id: N078
type: prompt
title: "Content brief for a freelance writer"
slug: content-brief-for-a-freelance-writer
category: SEO and content
audience: Marketers and site owners
related_pack: SEO Content Pack
price: free
status: published
tested: true
---

## What it's for
Hand a writer everything they need in one page.

## Fill in
- `{{topic}}`: what the article is about
- `{{keyword}}`: the target phrase
- `{{audience}}`: who will read it
- `{{goal}}`: what the reader should do next
- `{{must_include}}`: facts, products or links that have to appear

## Prompt

```
Write a one-page content brief for a freelance writer.

Topic: {{topic}}
Target keyword: {{keyword}}
Audience: {{audience}}
Goal of the article: {{goal}}
Must include: {{must_include}}

The brief should contain: working title, one-sentence summary, reader and their problem, the angle that makes this different, an outline with word counts per section, points and sources required, tone notes with one do and one don't, the call to action, and a short checklist the writer runs before submitting.

Rules:
- Keep it to what a writer needs. No background they will not use.
- Mark anything I still need to supply as [OWNER TO PROVIDE].
- Do not invent statistics, quotes or internal links.
```

## Example output

### Input used

**{{topic}}**
~~~~
How to pick the right dumpster size for a home remodel (kitchen, bathroom, roof, whole-house cleanout)
~~~~

**{{keyword}}**
~~~~
what size dumpster do I need for a remodel
~~~~

**{{audience}}**
~~~~
Homeowners in the Tampa Bay area planning a remodel, either DIY or with a contractor. Most have never rented a dumpster and are worried about overpaying or getting hit with overage fees.
~~~~

**{{goal}}**
~~~~
Click through to our online quote page and request a price for their ZIP code.
~~~~

**{{must_include}}**
~~~~
Our four sizes: 10, 20, 30 and 40 yard. Weight included: 1, 2, 3 and 4 tons. Overage is $75 per ton. 7-day rental included. Heavy debris like concrete, brick and dirt can only go in the 10-yard can. Link to our quote page. Banned items: paint, tires, batteries, freon appliances.
~~~~

### Output

~~~~
CONTENT BRIEF

WORKING TITLE
What Size Dumpster Do I Need for a Remodel? A Room-by-Room Guide

SUMMARY
A plain-language guide that helps a first-time renter match a dumpster size to their remodel and avoid weight overage fees.

READER AND THEIR PROBLEM
A Tampa Bay homeowner with a remodel coming up who has never rented a dumpster. They are afraid of ordering too small (a second haul) or too big (wasted money), and they have heard about surprise overage charges. They want a size recommendation they can trust and a clear idea of what the final bill could look like.

THE ANGLE
Most guides stop at cubic yards. This one treats weight as the other half of the answer: the same project can fit in a small can by volume and still go over the weight limit. Explain size and weight together, using our own sizes and limits.

OUTLINE (target 1,250 words)
1. Intro and quick answer (100 words): the short answer by project type, then a promise to explain why weight matters.
2. Our four sizes at a glance (150 words): a table or list of 10, 20, 30 and 40 yard with included tons.
3. Which size for which remodel (400 words): H3 for bathroom, kitchen, roof, whole-house cleanout. For each: typical size, and what drives it. Tell readers where the "it depends" lines are.
4. The weight trap (250 words): why volume is not the whole story, how overage is charged ($75 per ton), and a worked example using our numbers.
5. Heavy debris rule (100 words): concrete, brick and dirt go only in the 10-yard can, and why.
6. What you cannot throw away (100 words): paint, tires, batteries, appliances with freon.
7. What is included and how long you have (50 words): 7-day rental.
8. Wrap-up and call to action (100 words).

POINTS AND SOURCES REQUIRED
- Our sizes, included tons, overage rate, rental period, heavy-debris rule and banned items, all as supplied. Do not change or round them.
- The cubic-yard capacity of each size: [OWNER TO PROVIDE]
- Which size we recommend for each project type: [OWNER TO PROVIDE]. The writer should not guess; ask us or use our dispatcher's rule of thumb.
- Typical debris weights for roofing, drywall, cabinets: [OWNER TO PROVIDE] a source, or the writer cites a published reference and tells us where it came from.
- Permit and placement rules for the area: [OWNER TO PROVIDE], or leave out.
- A real customer example: [OWNER TO PROVIDE]. Do not invent one.
- URL of the quote page: [OWNER TO PROVIDE]
- Internal links: [OWNER TO PROVIDE]. Do not invent them.

TONE NOTES
- Do: write like a helpful dispatcher on the phone. Short sentences, concrete numbers, no jargon without a definition.
- Don't: use scare language about fees or pressure the reader to buy bigger.

CALL TO ACTION
Send the reader to the online quote page to get a price for their ZIP code. Place a mention after the size table and again at the end. Anchor text such as "Get a quote for your ZIP code".

BEFORE-YOU-SUBMIT CHECKLIST
[ ] Target phrase appears in the title, first 100 words and one H2, used naturally
[ ] Every size, weight limit and rate matches the brief exactly
[ ] No statistics, quotes or links that are not provided or sourced
[ ] Every [OWNER TO PROVIDE] item is either filled in or flagged in your cover note
[ ] Reading level suits a first-time renter
[ ] Quote link and CTA are in place
[ ] Word count within 10% of 1,250
~~~~
