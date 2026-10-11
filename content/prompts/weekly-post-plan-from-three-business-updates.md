---
id: N002
type: prompt
title: "Weekly post plan from three business updates"
slug: weekly-post-plan-from-three-business-updates
category: Social media
audience: Marketers and small business owners
related_pack: Social Post Pack
price: free
status: published
tested: true
---

## What it's for
Turn what actually happened this week into a simple posting plan.

## Fill in
- `{{updates}}`: three things that happened in the business this week
- `{{audience}}`: who follows you
- `{{platforms}}`: where you post
- `{{posts_per_week}}`: how many you can realistically publish

## Prompt

```
Build a one-week social posting plan from real business updates.

This week's updates:
{{updates}}

Audience: {{audience}}
Platforms: {{platforms}}
Posts I can publish this week: {{posts_per_week}}

Produce a table with one row per post: day, platform, format (photo, carousel, short video, text), the angle, and the first line.
Then write each post in full.

Rules:
- Every post must come from one of the three updates. If there are more slots than material, reuse an update from a new angle and say so.
- Mix at least two formats.
- No more than one post that directly sells.
- Finish with one photo or video I should capture this week to support these posts.
```

## Example output

### Input used

**{{updates}}**
~~~~
1. Our new oven got installed Tuesday, finally. Old one was on its last legs. It holds two trays at once now, so Saturday pickup orders should go faster.
2. Saturday at the Riverside Farmers Market was our best day yet. Sold out of the peanut butter pumpkin bones by 11am.
3. We're teaming up with Maple Street Vet Clinic. Starting next month they'll hand out our sample bags at puppy wellness visits.
~~~~

**{{audience}}**
~~~~
Local dog owners around Riverside, mostly 30 to 55, lots of new puppy owners
~~~~

**{{platforms}}**
~~~~
Instagram and Facebook
~~~~

**{{posts_per_week}}**
~~~~
5
~~~~

### Output

~~~~
WEEKLY POSTING PLAN

| Day | Platform | Format | Angle | First line |
|---|---|---|---|---|
| Mon | Instagram | Short video | Update 1: new oven reveal | "Our old oven finally retired. Meet the new one." |
| Tue | Facebook | Text | Update 3: vet clinic partnership | "Big news for Riverside puppy parents." |
| Wed | Instagram | Carousel | Update 2: market recap | "Sold out by 11am. Here's what happened last Saturday." |
| Thu | Facebook | Photo | Update 1 again, new angle: what the oven means for pickup orders (reused update) | "Two trays at a time means less waiting on Saturday." |
| Fri | Instagram | Photo | Update 2 again, new angle: the one direct-sell post (reused update) | "The peanut butter pumpkin bones sold out at the market. Want some?" |

POSTS IN FULL

MONDAY, Instagram, short video (Update 1)
Caption: Our old oven finally retired. Meet the new one. It went in last Tuesday and it holds two trays at once. For you, that means Saturday pickup orders should go faster.
On-screen text: "New oven. Two trays."

TUESDAY, Facebook, text (Update 3)
Big news for Riverside puppy parents. We're teaming up with Maple Street Vet Clinic. Starting next month, they'll hand out our sample bags at puppy wellness visits. If you have a new puppy, keep an eye out when you go in. If you are not at the clinic yet, you can always say hello at our next market stall.

WEDNESDAY, Instagram, carousel (Update 2)
Slide 1: "Sold out by 11am"
Slide 2: Photo of the market table, "Last Saturday at Riverside Farmers Market"
Slide 3: Photo of the empty tray, "Peanut butter pumpkin bones: gone"
Slide 4: "Thank you, Riverside. Best market day yet."
Caption: Sold out by 11am. Here's what happened last Saturday. The peanut butter pumpkin bones went first, and our best market day yet followed. Thank you to every dog owner who stopped by.

THURSDAY, Facebook, photo (Update 1 again, new angle: reused update)
Two trays at a time means less waiting on Saturday. Since the new oven went in last Tuesday, we can bake two trays at once, so Saturday pickup orders should go faster. Here is the oven doing its first full load.

FRIDAY, Instagram, photo (Update 2 again, new angle: reused update, the one direct-sell post)
The peanut butter pumpkin bones sold out at the market by 11am. Want some? Message us to order for Saturday pickup. [Add order cutoff time before posting.]

Notes on the plan:
- You gave three updates and five slots, so Update 1 and Update 2 are each used twice from a new angle (Thursday and Friday). Update 3 is used once because it has no other honest angle until the clinic handouts actually start.
- Formats: short video, text, carousel, photo (four formats).
- Only Friday sells directly.
- Friday needs your real order cutoff time; I left a placeholder rather than guess.
- Thursday's photo should be a real photo from a full oven load; the caption says "first full load" only if that is true, so change it if it is not.

Photo or video to capture this week (Monday morning, before the first post goes up): a vertical video clip (a few seconds is enough) of the new oven with two trays of treats going in or coming out. It supports Monday's reel and Thursday's photo (a still frame works), and a close shot of the peanut butter pumpkin bones on a tray will also help Friday's post.
~~~~
