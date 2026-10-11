---
id: N176
type: prompt
title: "One-page business plan"
slug: one-page-business-plan
category: Founder and strategy
audience: Founders
related_pack: Product Launch Pack
price: free
status: published
tested: true
---

## What it's for
Get the whole business on a single page.

## Fill in
- `{{idea}}`: what the business does
- `{{customer}}`: who it serves
- `{{numbers}}`: any real figures you have, such as prices, costs or sales

## Prompt

```
Help me write a one-page business plan.

The business: {{idea}}
Customer: {{customer}}
Real numbers I have: {{numbers}}

Sections, three lines each at most: the problem, the customer, the offer, how we reach customers, how we make money, what it costs to run, what makes us hard to copy, goals for the next 90 days, and the biggest risk.

Rules:
- Use only the numbers I gave. Where a number is needed and missing, write [NEED: what to find out] instead of estimating.
- Be specific. Replace any general statement with a concrete one or cut it.
- After the plan, list the three assumptions that would hurt most if wrong, and a cheap way to test each.
```

## Example output

### Input used

**{{idea}}**
~~~~
Wheelhouse Bike Repair: a van that comes to people's homes and workplaces in Duluth, MN to do bike tune-ups and basic repairs on the spot.
~~~~

**{{customer}}**
~~~~
Office commuters at downtown employers and families in the Lakeside neighborhood who own bikes but don't have time to drop them at a shop.
~~~~

**{{numbers}}**
~~~~
Tune-up price $85. Parts and supplies average $14 per tune-up. Used cargo van already bought and owned ($22,000, paid in cash from savings). Van insurance $140 a month. Fuel about $300 a month. I can do 4 tune-ups a day, 5 days a week. The nearest shop is booking about 2 weeks out right now.
~~~~

### Output

~~~~
**One-page plan: Wheelhouse Bike Repair**

**The problem**
- People with bikes in Duluth lose a day or more to dropping off and picking up a bike for a tune-up.
- The nearest shop is booking about 2 weeks out right now, so a rider who needs a fix waits.

**The customer**
- Office commuters at downtown employers and families in the Lakeside neighborhood who own bikes but can't spare time to drop them at a shop.

**The offer**
- A tune-up done at the customer's home or workplace, from the van, for $85.
- Basic repairs on the spot. [NEED: which repairs you will do in the van vs. take back to a shop, and what each costs]

**How we reach customers**
- Parking-lot days at downtown employers and a Lakeside neighborhood route. [NEED: which employers or neighbourhood groups you can contact first, and who your contact is at each]
- [NEED: how customers will book, e.g. text, form or phone, and what you will use to do it]

**How we make money**
- $85 per tune-up less $14 in parts and supplies leaves $71 per tune-up before your own pay.
- Capacity is 4 tune-ups a day, 5 days a week: 20 a week.

**What it costs to run**
- Known: van is owned ($22,000 already paid), insurance $140 a month, fuel about $300 a month, so $440 a month fixed. At $71 per tune-up, that is covered by 7 tune-ups a month (440 / 71 = 6.2, rounded up).
- [NEED: tools and stock, business licence or permits for working from a van, booking and payment fees, marketing, your own pay]

**What makes us hard to copy**
- Not much yet. The edge is speed: a booked-out shop 2 weeks away vs. same-week service at the customer's door.
- Repeat bookings from an employer's staff or one neighbourhood would be harder to copy than the service. [NEED: whether you have any employer or neighbourhood relationships already]

**Goals for the next 90 days**
- Complete the first paid tune-ups and book a first employer parking-lot day.
- [NEED: your target number of tune-ups per week at day 90, out of the 20-a-week capacity]

**Biggest risk**
- Not enough people will pay $85 to have the bike come to them rather than wait for the shop, so days are only partly filled.

**Three assumptions that would hurt most if wrong, and a cheap test for each**
1. *Enough commuters will pay $85 for a visit rather than wait for the shop.* Test: offer 5 to 10 pre-booked tune-ups to one downtown office and see how many say yes at $85 before you run a day.
2. *You can do 4 tune-ups a day, including setup and driving.* Test: do a timed two-day trial on friends' or family members' bikes and record how long each job takes door to door.
3. *Parts and supplies average $14.* Test: track parts cost on your first 10 real jobs and recompute the $71 figure.
~~~~
