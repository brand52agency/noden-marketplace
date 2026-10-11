---
id: N127
type: prompt
title: "Help article from a solved ticket"
slug: help-article-from-a-solved-ticket
category: Customer support
audience: Support teams and business owners
related_pack: Customer Support Pack
price: free
status: drafted
tested: false
---

## What it's for
Turn one answered question into a page that prevents the next ten.

## Fill in
- `{{ticket}}`: the customer's question and the answer that solved it
- `{{product}}`: the product or service involved

## Prompt

```
Turn this solved support ticket into a help article.

Ticket and resolution:
{{ticket}}

Product: {{product}}

Write the article with:
- A title phrased the way a customer would search for it.
- A one-sentence answer at the top.
- Numbered steps, one action per step.
- What the customer should see when it works.
- "If that did not work": the two most likely causes and what to try.
- When to contact support and what to include.

Rules:
- Remove all personal details from the ticket.
- Use only steps confirmed in the resolution. Mark anything you inferred as [VERIFY].
- Plain words. Name buttons and menus exactly as given.
- Add three alternative titles and five search phrases this article should match.
```

## Example output
TODO: run this prompt once with a realistic input and paste the real output here. Do not write an example by hand.
