---
id: N051
type: prompt
title: "Welcome email sequence for new subscribers"
slug: welcome-email-sequence-for-new-subscribers
category: Email
audience: Marketers and small business owners
related_pack: Email Marketing Pack
price: free
status: published
tested: true
---

## What it's for
Give new subscribers a good first week.

## Fill in
- `{{business}}`: what you offer
- `{{signup_reason}}`: what people signed up to get
- `{{offer}}`: any welcome offer, or none
- `{{voice}}`: three words describing how you sound

## Prompt

```
Write a three-email welcome sequence.

Business: {{business}}
Why people subscribed: {{signup_reason}}
Welcome offer: {{offer}}
Voice: {{voice}}

Email 1 (sent immediately): deliver what they signed up for and set expectations for what I will send and how often.
Email 2 (day 2): one useful thing they can use today, related to why they signed up.
Email 3 (day 5): who we are in a few lines, one piece of proof, and one clear next step.

For each email give: two subject line options, preview text, and the body under 150 words.

Rules:
- Do not invent testimonials, statistics or customer counts. Where proof belongs, write [ADD REAL PROOF] and say what kind would fit.
- One call to action per email.
- If the welcome offer is "none", do not make one up.
```

## Example output

### Input used

**{{business}}**
~~~~
Larkspur Plant Co., an online shop selling beginner-friendly houseplants and care supplies, run by two people out of a small studio in Portland, Oregon
~~~~

**{{signup_reason}}**
~~~~
A free printable Houseplant Watering Cheat Sheet (PDF) covering 12 common beginner plants
~~~~

**{{offer}}**
~~~~
10% off a first order with code WELCOME10
~~~~

**{{voice}}**
~~~~
warm, plainspoken, a little funny
~~~~

### Output

~~~~
EMAIL 1 (sent immediately)
Subject line options:
  A. Your watering cheat sheet is here
  B. Here's the cheat sheet (go save a plant)
Preview text: Download it, print it, stick it on the fridge. Here's what comes next.

Hi there,

Welcome to Larkspur, and thanks for signing up. Your Houseplant Watering Cheat Sheet is ready. It covers 12 common beginner plants, so you can stop guessing and start watering on purpose.

Print it, tape it near your plants, or save it to your phone. We won't judge where it ends up. (Okay, we'll judge a little if it's under the cat bowl.)

What to expect from us: care tips and new plant arrivals, sent [FREQUENCY, e.g. once a week]. No spam, and you can leave whenever you like.

Tomorrow we'll send one small trick you can use right away.

Download your cheat sheet: [link]

The Larkspur team

(Call to action: Download your cheat sheet)

---

EMAIL 2 (day 2)
Subject line options:
  A. The two-second test that saves plants
  B. Try this on your plants today
Preview text: No gadgets, no schedule. Just your finger and about a minute.

Hi again,

Here's the most useful plant skill we know, and it costs nothing: the finger test.

Push one finger into the soil, about an inch down. If it feels dry, water. If it feels damp, wait a day or two and check again. Most overwatering starts with watering on a schedule instead of checking.

Your cheat sheet tells you how each plant likes to be treated. The finger test tells you what is actually happening in the pot today. Use both and you'll get it right more often than not.

Try it on the plant closest to you right now, then hit reply and tell us which plant you tested and what you found. We read every one.

The Larkspur team

(Call to action: Reply and tell us which plant you tested)

---

EMAIL 3 (day 5)
Subject line options:
  A. Who's behind Larkspur (and a little thank-you)
  B. Meet the two of us
Preview text: A short hello, what customers say, and 10% off your first order.

Hi there,

A quick hello. We're two people running Larkspur out of a small studio in Portland, Oregon. We sell beginner-friendly houseplants and the supplies to keep them going, because we think everyone should get a good first plant.

[ADD REAL PROOF: a short, genuine customer quote or before-and-after photo of a plant doing well. Do not use a number of customers or reviews unless it is true and current.]

If you're ready for a plant of your own, here's a thank-you for joining us: 10% off your first order with code WELCOME10.

Pick your first plant: [link]

The Larkspur team

(Call to action: Pick your first plant (code WELCOME10))

Note on proof: in Email 3, a short genuine customer quote about a plant surviving or thriving, or a before-and-after photo from a real customer, would fit best. Frequency in Email 1 is a placeholder because it was not provided.
~~~~
