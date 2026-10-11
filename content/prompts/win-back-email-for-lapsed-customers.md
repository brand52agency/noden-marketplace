---
id: N053
type: prompt
title: "Win-back email for lapsed customers"
slug: win-back-email-for-lapsed-customers
category: Email
audience: Marketers and small business owners
related_pack: Email Marketing Pack
price: free
status: published
tested: true
---

## What it's for
Reach people who have gone quiet without sounding desperate.

## Fill in
- `{{business}}`: what you sell
- `{{last_purchase}}`: what lapsed customers typically bought and how long ago
- `{{whats_new}}`: anything that has changed since
- `{{incentive}}`: an offer you are willing to make, or none

## Prompt

```
Write a win-back email to customers who have not bought in a while.

Business: {{business}}
What they bought and when: {{last_purchase}}
What is new since then: {{whats_new}}
Incentive: {{incentive}}

Give me two versions:
A. Short and personal, under 90 words, plain text, written as if from the owner.
B. Slightly longer, under 160 words, leading with what is new.

For each: two subject lines, preview text, body, and one call to action.

Rules:
- No guilt and no "we miss you" clichés.
- Mention the incentive only if one is given.
- Include an easy way to say "not interested" besides unsubscribing.
- Add a one-line suggestion for when to send a single follow-up and what it should say.
```

## Example output

### Input used

**{{business}}**
~~~~
Fieldnote Candle Co., a small-batch soy candle and wax melt shop selling online and at two local craft fairs
~~~~

**{{last_purchase}}**
~~~~
Most lapsed customers bought a single 8 oz candle, usually a seasonal scent, 12 to 18 months ago
~~~~

**{{whats_new}}**
~~~~
We now sell refill pouches so you can reuse your jar, we moved to lead-free cotton wicks, and we added a four-scent sample set
~~~~

**{{incentive}}**
~~~~
Free shipping on one order, no minimum, through November 30
~~~~

### Output

~~~~
VERSION A (short and personal, plain text)
Subject line options:
  1. What's new since your last candle
  2. Refill pouches, for your old jar
Preview text: Reuse your jar, and shipping is on us through Nov 30.

Hi [first name],

You picked up one of our 8 oz candles a while back, and I wanted to tell you what has changed since. We now sell refill pouches, so you can reuse your jar, and we've moved to lead-free cotton wicks.

If you'd like to try either, shipping on your next order is free through November 30, no minimum.

See the refills: [link]

Not for you? Just reply "no thanks" and I'll take you off the candle emails.

[Your first name]
Fieldnote Candle Co.

(Call to action: See the refills)

---

VERSION B (longer, leads with what's new)
Subject line options:
  1. Three things that are new at Fieldnote
  2. Your old jar can burn again
Preview text: Refill pouches, cotton wicks and a sample set. Free shipping through Nov 30.

Hi [first name],

A fair bit has changed since your last Fieldnote candle:

- Refill pouches. Keep your jar and refill it instead of buying a new candle.
- Lead-free cotton wicks.
- A four-scent sample set, if you'd like to try a few before you commit to a full candle.

To make it easy to come back, shipping on one order is free through November 30, with no minimum.

Browse what's new: [link]

If candle emails aren't your thing anymore, click here and tell us "not interested": [link]. We'll stop sending them, no hard feelings.

Fieldnote Candle Co.

(Call to action: Browse what's new)

---

Follow-up suggestion: Send one follow-up about a week later, around November 20, with the subject "Free shipping ends November 30" and only two lines: the deadline and the link to the refills. Don't send more than one.
~~~~
