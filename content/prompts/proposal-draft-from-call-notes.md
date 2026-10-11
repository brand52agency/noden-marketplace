---
id: N102
type: prompt
title: "Proposal draft from call notes"
slug: proposal-draft-from-call-notes
category: Sales
audience: Founders and sales teams
related_pack: Sales Outreach Pack
price: free
status: drafted
tested: false
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
TODO: run this prompt once with a realistic input and paste the real output here. Do not write an example by hand.
