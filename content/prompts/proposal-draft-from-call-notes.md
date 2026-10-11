---
id: N102
type: prompt
title: "Proposal draft from call notes"
slug: proposal-draft-from-call-notes
category: Sales
audience: Founders and sales teams
related_pack: Sales Outreach Pack
price: free
status: published
tested: true
---

## What it's for
Turn rough notes into a proposal the same day.

## Fill in
- `{{notes}}`: your raw call notes
- `{{offer}}`: what you will deliver
- `{{price}}`: the price and terms
- `{{company}}`: your business name

## Prompt

```
Draft a proposal from these call notes.

Call notes:
{{notes}}

What I will deliver: {{offer}}
Price and terms: {{price}}
My business: {{company}}

Structure:
1. What we heard: their situation and goals, in their words where the notes allow.
2. What we will do: scope as a short list of deliverables.
3. What is not included.
4. Timeline with milestones.
5. Price and payment terms, exactly as given.
6. What we need from them.
7. Next step and how long the proposal is valid.

Rules:
- Use only facts from the notes. Where the notes are thin, write [CONFIRM WITH CLIENT] instead of filling the gap.
- Keep it under 500 words.
- Do not add guarantees, results or legal terms I did not supply.
- End with a list of questions I should answer before sending.
```

## Example output

### Input used

**{{notes}}**
~~~~
call w/ Dana Whitfield, Alder Creek Physical Therapy, Tues 2:30. 2 clinics (Bend + Redmond), 9 staff total. site is 6 yrs old, wordpress, she said it "looks like 2016 and nobody can edit it". patients cant book online - they call, front desk drowning. quote: "we lose people who just want to click a time". wants online booking + new site live by start of Jan, they run a new-year resolutions promo every year. has logo + photos from a shoot last spring. no copy written at all. uses Jane App for scheduling already (pretty sure?). google business profile is a mess, 2 listings for Redmond. budget: "under 10k". decision makers = her + biz partner Marcus, he's out until the 20th. didnt discuss hosting. blog maybe later, not now.
~~~~

**{{offer}}**
~~~~
New 8-page website for both locations, online booking connected to their existing scheduling software, copywriting for all pages, Google Business Profile cleanup, and one training session for staff on editing the site.
~~~~

**{{price}}**
~~~~
$8,400 total. 50% ($4,200) to start, 50% on launch. Hosting not included.
~~~~

**{{company}}**
~~~~
Lantern Web Studio
~~~~

### Output

~~~~
**Proposal for Alder Creek Physical Therapy**
Prepared by Lantern Web Studio

**1. What we heard**
Alder Creek runs two clinics (Bend and Redmond) with nine staff. Your website is six years old, on WordPress, and in Dana's words "looks like 2016 and nobody can edit it." Patients cannot book online, so they call and the front desk is stretched: "we lose people who just want to click a time." You want online booking and a new site live by the start of January, ahead of your New Year resolutions promotion. Your Google Business Profile also has two listings for Redmond.

**2. What we will do**
- A new 8-page website covering both locations
- Online booking connected to your existing scheduling software (Jane App [CONFIRM WITH CLIENT])
- Copywriting for all pages
- Google Business Profile cleanup, including the duplicate Redmond listing
- One staff training session on editing the site

**3. What is not included**
- Hosting
- A blog (you said maybe later, not now)
- Anything not listed in section 2

**4. Timeline**
Target: live by the start of January.
- Kickoff: [CONFIRM WITH CLIENT]
- Copy draft: [CONFIRM WITH CLIENT]
- Design review: [CONFIRM WITH CLIENT]
- Booking connected and tested: [CONFIRM WITH CLIENT]
- Launch: start of January, exact date [CONFIRM WITH CLIENT]

**5. Price and payment terms**
$8,400 total. 50% ($4,200) to start, 50% on launch. Hosting not included.

**6. What we need from you**
- Your logo and the photos from last spring's shoot
- Confirmation of your scheduling software and access to it
- Access to your Google Business Profile
- Sign-off from Dana and Marcus
- Feedback turnaround times: [CONFIRM WITH CLIENT]

**7. Next step**
Dana and Marcus review this together. Marcus is out until the 20th, so we suggest a decision call after that: [CONFIRM WITH CLIENT]. This proposal is valid for [CONFIRM WITH CLIENT].

**Questions to answer before sending**
1. Is the scheduling software definitely Jane App, and does connecting it need a paid plan?
2. What are the kickoff, milestone and launch dates?
3. How long is the proposal valid?
4. Who hosts the site today, and will you quote hosting separately?
5. How many revision rounds are included?
6. Is the budget ("under 10k") a firm ceiling?
~~~~
