---
id: N076
type: prompt
title: "Blog outline from a target keyword"
slug: blog-outline-from-a-target-keyword
category: SEO and content
audience: Marketers and site owners
related_pack: SEO Content Pack
price: free
status: published
tested: true
---

## What it's for
Plan an article that answers what the searcher wants.

## Fill in
- `{{keyword}}`: the phrase you want to rank for
- `{{business}}`: what you do and who you serve
- `{{expertise}}`: what you know first-hand about this topic

## Prompt

```
Plan a blog article.

Target keyword: {{keyword}}
Business: {{business}}
What I know first-hand: {{expertise}}

Give me:
1. The likely intent behind this search, and what the reader wants to be able to do after reading.
2. Three title options under 60 characters.
3. An outline with H2 and H3 headings. Under each heading, one line on what to cover and which of my first-hand points belongs there.
4. A direct two-sentence answer to the main question, to place near the top.
5. Four related questions to answer in an FAQ section.
6. One original element only I could add: a photo, a number from my own work, a short example.

Rules:
- Do not state search volumes, rankings or statistics. You cannot see them.
- Flag any section where I will need a source, and say what kind.
```

## Example output

### Input used

**{{keyword}}**
~~~~
how to winterize a sprinkler system
~~~~

**{{business}}**
~~~~
Cedar Fork Irrigation, a three-person sprinkler installation and repair company serving homeowners in the suburbs of Boise, Idaho.
~~~~

**{{expertise}}**
~~~~
We do about 400 winterizations a season and have for six seasons. Biggest mistake we see: homeowners shut off the water but never open the drain valves, and the backflow preventer cracks. We blow out with a compressor, one zone at a time, at 50 psi max on PVC and 80 psi max on poly pipe. A cracked backflow preventer usually costs around $350 to replace; our winterization visit is $95. First hard frost here is usually late October and we are booked solid by Oct 20.
~~~~

### Output

~~~~
1. SEARCH INTENT

Intent: informational, how-to. The searcher is almost certainly a homeowner with an in-ground sprinkler system, searching in autumn, who is worried about freeze damage and unsure whether to do it themselves or pay someone.

After reading, they should be able to: decide whether DIY is realistic for them, shut off the water, drain and blow out every zone without damaging pipes, protect the backflow preventer and controller, and know when to call a pro.

2. TITLE OPTIONS (under 60 characters)

- How to Winterize a Sprinkler System, Step by Step (49)
- Winterize Your Sprinklers: DIY Blowout Guide (44)
- How to Winterize Sprinklers Before the First Freeze (51)

3. OUTLINE

H1: (use one of the titles above)

Intro (no heading): Lead with the direct answer from section 4, then one line on what is at stake (frozen water cracking pipes and valves).

H2: Why sprinkler systems need winterizing
Cover: water left in pipes expands when it freezes and splits the weakest parts first. First-hand point: the backflow preventer is what you see crack most often; you can set up the repair-vs-visit cost contrast later in the article.
Source needed: one general reference on freeze damage to irrigation components, such as a university extension office or a pipe/valve manufacturer guide.

H2: When to winterize
  H3: Timing in a cold-winter climate
  Cover: do it after the last watering and before the first hard freeze. First-hand point: first hard frost in your area is usually late October, and your schedule is full by Oct 20, so homeowners should book or start early.
  Source needed: your local average first-frost date from the National Weather Service or your state extension office. Do not give a date without it.
  H3: Signs you have waited too long
  Cover: overnight lows near freezing, water in the system you cannot drain. First-hand point: none supplied; add a short note on what you have seen on late callouts.

H2: DIY or hire a pro?
  H3: What you need to do it yourself
  Cover: a compressor and the right fittings, eye protection, your system's zone map. First-hand point: the pressure limits you use (50 psi max on PVC, 80 psi max on poly).
  Source needed: compressor volume (CFM) requirement. Take it from your own equipment or a manufacturer spec, not from memory.
  H3: When it makes sense to call someone
  Cover: unknown pipe type, no compressor, a system with a complicated backflow setup. First-hand point: your $95 winterization visit versus the cost of a repair.

H2: How to winterize a sprinkler system, step by step
  H3: Step 1: Shut off the water supply
  Cover: locate and close the main shutoff to the system. First-hand point: none supplied; a photo of a typical shutoff would help here.
  H3: Step 2: Open the drain valves
  Cover: relieve pressure and open manual drains so gravity clears low points. First-hand point: this is the step homeowners skip, and the one that leads to cracked backflow preventers.
  H3: Step 3: Blow out the lines, one zone at a time
  Cover: connect the compressor, run each zone until only mist comes out, and never run all zones at once. First-hand point: your 50 psi PVC and 80 psi poly limits, and why you work zone by zone.
  Source needed: confirm the pressure limits against the pipe manufacturer's guidance before publishing, since readers may have different pipe.
  H3: Step 4: Protect the backflow preventer and controller
  Cover: leave handles at the right position, insulate above-ground parts, set the controller to rain or off mode. First-hand point: the cracked backflow preventer you see most.
  Source needed: your backflow preventer manufacturer's winterizing instructions, or local code if your water utility requires anything.

H2: Common winterizing mistakes
Cover: skipping drain valves, too much pressure, blowing out all zones at once, waiting until after a freeze. First-hand point: your list of what you see on repair calls.

H2: What winterizing costs vs. what freeze damage costs
Cover: your own pricing, as a plain comparison. First-hand point: $95 for the visit versus roughly $350 for a cracked backflow preventer. State clearly that these are your local prices and can change.
Source needed: none, as long as the figures are yours. Date the article so the prices are not read as permanent.

H2: Frequently asked questions
Cover: see section 5.

4. DIRECT ANSWER (near the top)

To winterize a sprinkler system, shut off the water supply, open the manual drain valves, and use an air compressor to blow the remaining water out of each zone, one at a time, before the first hard freeze. Keep air pressure within the limit for your pipe type, and protect the backflow preventer, since that is the part that most often cracks.

5. FAQ QUESTIONS

- Can I winterize my sprinklers without an air compressor? (Cover: drain valves alone may leave water behind in low spots. Source needed: a manufacturer or extension office statement on drain-only winterizing.)
- What happens if I do not winterize my sprinkler system? (Cover: pipe, valve and backflow damage you have seen. First-hand point: the cracked backflow preventer. No source needed if you stick to your own jobs.)
- How much does it cost to have a pro winterize a sprinkler system? (Cover: your $95 visit, noting that other companies price differently.)
- When should I turn my sprinklers back on in spring? (Cover: after the last hard frost, with a slow refill. Source needed: local last-frost guidance from your extension office.)

6. ONE ORIGINAL ELEMENT ONLY YOU COULD ADD

A photo of a cracked backflow preventer from one of your real jobs, with a caption stating what caused it (drain valves left closed) and what the repair cost. Pair it with a one-line count of how many winterizations you do each season. Get the customer's permission and crop out the house number first.
~~~~
