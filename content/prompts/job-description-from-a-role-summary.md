---
id: N153
type: prompt
title: "Job description from a role summary"
slug: job-description-from-a-role-summary
category: Operations
audience: Owners and operations leads
related_pack: none
price: free
status: published
tested: true
---

## What it's for
Write a posting that attracts the right applicants.

## Fill in
- `{{role}}`: the job title and what the person will do
- `{{must_haves}}`: what is truly required
- `{{pay_and_terms}}`: pay range, hours, location
- `{{company}}`: a few lines about your business

## Prompt

```
Write a job description.

Role: {{role}}
Truly required: {{must_haves}}
Pay and terms: {{pay_and_terms}}
About us: {{company}}

Include: a two-sentence summary, what you will do in a typical week, what you need, what would be a bonus, pay and terms exactly as given, how to apply, and what happens after applying.

Rules:
- Requirements list only what I marked as required. Do not add degrees or years of experience I did not ask for.
- Plain language. No "rockstar", "ninja" or "fast-paced environment".
- Use wording that does not exclude people by age, gender or background, and flag any phrase in my input that might.
- Under 400 words.
- Add three screening questions I could ask applicants.
```

## Example output

### Input used

**{{role}}**
~~~~
Part-time shop assistant at our plant nursery. Water and restock plants, help customers pick plants, run the register, unload the weekly delivery, and hand over online orders for pickup.
~~~~

**{{must_haves}}**
~~~~
Able to lift 40 lbs. Available both Saturday and Sunday. Friendly and patient with customers.
~~~~

**{{pay_and_terms}}**
~~~~
$17 to $19 an hour depending on experience. About 20 hours a week: Saturday and Sunday 8am to 4pm, plus one weekday shift we agree together. In person at 1420 Orchard Lane, Millbrook.
~~~~

**{{company}}**
~~~~
Greenhollow Nursery. Family-run for 14 years, small crew of six. Relaxed but busy on spring weekends. We're looking for a young, energetic person to join the team.
~~~~

### Output

~~~~
Part-Time Shop Assistant, Greenhollow Nursery

Summary
Greenhollow Nursery is a family-run plant nursery with a crew of six, and we are hiring a part-time shop assistant. You will help customers choose plants, run the register and keep the sales floor looking good, mostly on weekends.

What you will do in a typical week
- Water and restock plants on the sales floor
- Help customers choose plants
- Run the register and take payments
- Unload and put away the weekly delivery
- Pull online orders and hand them over for pickup

What you need
- Able to lift 40 lbs, with or without accommodation
- Available both Saturday and Sunday
- Friendly and patient with customers

Bonus
- Knowing plants or gardening
- Past retail or cash-handling experience
We will teach you the rest.

Pay and terms
- $17 to $19 an hour, depending on experience
- About 20 hours a week: Saturday and Sunday, 8am to 4pm, plus one weekday shift we agree together
- In person at 1420 Orchard Lane, Millbrook

How to apply
[Add how to apply: an email address or in-person drop-off, and what to include.]

What happens after you apply
[Add your steps and how long applicants should expect to wait to hear back.]

Screening questions you could ask
1. This job needs both Saturday and Sunday. Can you work both every week?
2. Tell me about a time you helped someone find what they needed.
3. What would you do if a customer asked about a plant you did not know?

Wording flagged in your input
- "a young, energetic person" points to age. It is replaced above with the duties and requirements you listed. Describe the work instead of the person.
- "Able to lift 40 lbs" is kept as a requirement; "with or without accommodation" has been added so the line does not exclude people who can do the job with support.
~~~~
