---
id: N126
type: prompt
title: "Reply drafts from a customer message"
slug: reply-drafts-from-a-customer-message
category: Customer support
audience: Support teams and business owners
related_pack: Customer Support Pack
price: free
status: drafted
tested: false
---

## What it's for
Answer a customer quickly and well.

## Fill in
- `{{message}}`: the customer's message
- `{{policy}}`: the relevant policy or what you can offer
- `{{voice}}`: how your business sounds

## Prompt

```
Draft a reply to this customer.

Customer message:
{{message}}

What our policy allows: {{policy}}
Our voice: {{voice}}

First, in two lines: what the customer is asking for, and how they seem to feel.
Then write three replies:
A. Brief: under 60 words.
B. Standard: under 120 words.
C. Extra care: for a frustrated customer, under 150 words.

Rules:
- Answer the actual question in the first two sentences.
- Promise only what the policy above allows. If the policy does not cover this, say so and write the reply to hold the line while I check.
- No blame, no jargon, no "unfortunately" as an opener.
- End each with the specific next step and who takes it.
- List any information I need from the customer before sending.
```

## Example output
TODO: run this prompt once with a realistic input and paste the real output here. Do not write an example by hand.
