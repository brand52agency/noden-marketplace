---
id: N178
type: prompt
title: "Pricing options with trade-offs"
slug: pricing-options-with-trade-offs
category: Founder and strategy
audience: Founders
related_pack: Product Launch Pack
price: free
status: published
tested: true
---

## What it's for
Compare ways to charge before committing to one.

## Fill in
- `{{offer}}`: what you sell
- `{{costs}}`: what it costs you to deliver
- `{{current_price}}`: what you charge now, if anything
- `{{customers}}`: who buys and how they buy

## Prompt

```
Help me think through pricing.

What I sell: {{offer}}
My cost to deliver: {{costs}}
Current price: {{current_price}}
Who buys and how: {{customers}}

Lay out three pricing structures that could fit, such as flat, tiered, per-use or subscription. For each: how it would work, who it favors, the margin at my stated costs, what could go wrong, and what I would need to track.

Then give a simple table comparing the three, and say which you would test first and how to test it with real customers at low risk.

Rules:
- Show the arithmetic for any margin.
- Do not state market rates or what competitors charge. You cannot see them. Tell me how to find out.
- This is a framework for my decision, not financial advice.
```

## Example output

### Input used

**{{offer}}**
~~~~
Mobile dog grooming: a fully equipped van that comes to the customer's driveway. Bath, haircut, nails, ears.
~~~~

**{{costs}}**
~~~~
Groomer pay $22 an hour. Time per groom: small dogs about 1 hour, medium about 1.5 hours, large about 2.5 hours. Supplies $9 per groom. Fuel and vehicle wear $6 per groom. Fixed costs $480 a month for the van payment and insurance.
~~~~

**{{current_price}}**
~~~~
$85 flat for every dog, regardless of size.
~~~~

**{{customers}}**
~~~~
About 60 repeat clients. Most book by text every 6 to 8 weeks and pay by card after the groom. Roughly a third small dogs, a third medium, a third large.
~~~~

### Output

~~~~
**First, your cost per groom (labor + supplies + fuel and wear)**
- Small (1 hr): 22 x 1 = $22, + $9 + $6 = **$37**
- Medium (1.5 hr): 22 x 1.5 = $33, + $9 + $6 = **$48**
- Large (2.5 hr): 22 x 2.5 = $55, + $9 + $6 = **$70**

At your current $85 flat price, the margin per groom is: small $85 - $37 = $48 (56.5%), medium $85 - $48 = $37 (43.5%), large $85 - $70 = $15 (17.6%). Blended across a third each: (48 + 37 + 15) / 3 = $33.33 per groom. The $480 monthly fixed cost is covered by 13 medium grooms (480 / 37 = 12.97).

**Option A: Flat price (what you do now)**
- How it works: one price for every dog. Keep $85, or adjust it for everyone.
- Who it favors: owners of large dogs, who get the most work for the same price; it is also the simplest to quote by text.
- Margin: as above. Large dogs return only $15 (15 / 85 = 17.6%) while small dogs return $48.
- What could go wrong: you are most busy with the jobs that earn the least. If your large dogs take more than 2.5 hours, the margin shrinks quickly.
- Track: actual groom time by dog size, and the number of large dog bookings per week.

**Option B: Tiered by dog size**
- How it works: set the price by size. As an illustration (not a market rate), choose prices that earn about the 43.5% margin that medium dogs earn now: small 37 / (1 - 0.435) = $65.5, so $65; medium $85; large 70 / (1 - 0.435) = $123.9, so $125.
- Who it favors: owners of small dogs (price drops $20) and you on large dogs (price rises $40).
- Margin: small $65 - $37 = $28 (43.1%); medium $85 - $48 = $37 (43.5%); large $125 - $70 = $55 (44.0%). Blended with a third each: (28 + 37 + 55) / 3 = $40.00, versus $33.33 flat, a gain of $6.67 per groom.
- What could go wrong: large-dog owners may leave or push back; small-dog price cut may reduce income if it does not bring more bookings. Dog size borderlines cause arguments.
- Track: rebooking rate by size tier, price pushback, and actual time per groom per tier.

**Option C: Prepaid bundle (a membership)**
- How it works: a client pays upfront for 4 grooms at a discount. Illustration for medium dogs: $300 for four, or $75 each rather than $85.
- Who it favors: your regulars, who already come back every 6 to 8 weeks; it favors you with cash upfront and locked-in repeat visits.
- Margin: revenue $300, cost 4 x $48 = $192, margin $108 (36.0%), $27 per groom versus $37 at $85.
- What could go wrong: you give up $10 per groom for a promise; clients may move, a dog may pass away or have a health issue, and you may owe refunds. It also does not fix the large dog problem unless sized.
- Track: bundle sign-ups, how many sessions get used, cancellations or refunds, and cash on hand from upfront payments.

**Comparison**

| | A: Flat $85 | B: Tiered 65/85/125 | C: Prepaid bundle (medium) |
|---|---|---|---|
| Margin per groom (S / M / L) | $48 / $37 / $15 | $28 / $37 / $55 | n/a / $27 / n/a |
| Blended margin (equal mix) | $33.33 | $40.00 | not comparable (medium only) |
| Simplicity | Highest | Medium | Medium |
| Cash timing | After each groom | After each groom | Upfront |
| Main risk | Large dogs lose money share | Pushback from large-dog owners | Discount without enough retention gain |

**What I would test first: B, on large dogs only**
Large dogs are where you earn least ($15, or 17.6%), so there is the most to gain and the test is narrow. Low-risk way to test:
1. For new large-dog clients only, quote $125 for the next four weeks.
2. For existing large-dog clients, tell them about the change on their next booking text, with a few weeks' notice.
3. Track acceptance rate, rebooking, and actual time per groom.
4. If most accept and rebook, extend to full tiers. If many leave, try $105 as a midpoint (70 / 105 gives a $35 margin, 33.3%).

**Market rates:** I can't see what other groomers charge. To find out, check the websites and social pages of local groomers, ask a few clients what they were paying before, and call two competitors as a customer for a quote by dog size.

This is a framework to help your decision, not financial advice.
~~~~
