---
id: N001
type: prompt
title: "Turn one customer review into five posts"
slug: turn-one-customer-review-into-five-posts
category: Social media
audience: Marketers and small business owners
related_pack: Social Post Pack
price: free
status: published
tested: true
---

## What it's for
Get a week of social proof out of a single good review.

## Fill in
- `{{review}}`: the customer's words, pasted exactly
- `{{business}}`: what you sell and who to
- `{{platforms}}`: where you post

## Prompt

```
You are helping a small business turn one customer review into social posts.

Review (use the customer's exact words, do not embellish):
{{review}}

Business: {{business}}
Platforms: {{platforms}}

Write five different posts based on this review:
1. A quote post that leads with the strongest line of the review.
2. A short story post: the customer's problem, what happened, the result.
3. A post that answers the doubt this review overcomes.
4. A behind-the-scenes post about the work that earned the review.
5. A thank-you post addressed to the customer (first name only, or "a customer" if no name is given).

Rules:
- Never invent details, numbers or results that are not in the review.
- Keep each post under 120 words and match the norms of each platform listed.
- End each with one plain call to action.
- After the posts, list any claim you were tempted to add but left out because the review did not support it.
```

## Example output

### Input used

**{{review}}**
~~~~
Brought in my daughter's old bike thinking it was a lost cause. Marcus (the owner) told me straight up what needed fixing and what could wait, didn't try to upsell me anything. Had it back to me in two days and the price was less than I was braced for. She's been riding it to school every day since. Will be back for my own bike in spring. Five stars. - Jen T.
~~~~

**{{business}}**
~~~~
Pine & Pivot Bike Repair, a two-person neighborhood bike shop in Duluth, Minnesota. We do tune-ups and repairs for everyday riders, commuters and families.
~~~~

**{{platforms}}**
~~~~
Instagram and Facebook
~~~~

### Output

~~~~
1. Quote post (Instagram + Facebook)
“Marcus (the owner) told me straight up what needed fixing and what could wait, didn't try to upsell me anything.”

Thank you, Jen T., for the five stars and for saying out loud what we most want to be known for.

Message us to book your bike in.

#BikeRepair #Duluth

2. Short story post (Instagram + Facebook)
Jen brought in her daughter's old bike thinking it was a lost cause.

We looked it over and told her what needed fixing and what could wait. She had it back in two days, and the price was less than she was braced for.

Her daughter has been riding it to school every day since.

Got an old bike in the garage? Message us and ask.

3. Answering the doubt (Facebook-first, works on Instagram)
"Is my old bike even worth fixing, or will the shop just try to sell me more?"

Jen brought her daughter's bike in "thinking it was a lost cause." What she got was a straight answer about what needed fixing, what could wait, and no upselling.

Wondering the same about yours? Message us and ask.

4. Behind-the-scenes post (Instagram + Facebook)
The work that earned this review, in Jen's words: Marcus "told me straight up what needed fixing and what could wait."

That is the job. Look at the bike, sort what needs doing now from what can wait, say so plainly, and don't push extras. Jen had her daughter's bike back in two days.

Bring us the bike you've been putting off. Message us to book a spot.

#BikeRepair #Duluth

5. Thank-you post to the customer (Instagram + Facebook)
Thank you, Jen!

You told us your daughter has been riding that old bike to school every day since you picked it up. That is about the best thing a bike shop can hear.

Thanks for trusting us with it, and for the five stars. We'll see you in spring for your own bike.

Message us when you're ready to book.

Claims I was tempted to add but left out because the review does not support them:
- What was actually wrong with the bike or which parts were replaced (the review only says it seemed like a lost cause).
- Any price, discount or the word "cheap" or "affordable" (the review only says the price was less than she braced for).
- That Marcus is certified, experienced or has been in business for any length of time.
- That every customer gets the same honest advice, or that the shop never upsells (that is Jen's experience, not a guarantee).
- That the bike now "rides like new" or is safe for kids (the review says only that she rides it to school every day).
- That the shop offers fast or two-day turnaround on every job (the review says two days for this bike).
- That Jen is a longtime customer (she says she will be back, not that she has been before).
~~~~
