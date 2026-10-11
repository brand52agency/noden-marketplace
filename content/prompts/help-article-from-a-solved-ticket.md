---
id: N127
type: prompt
title: "Help article from a solved ticket"
slug: help-article-from-a-solved-ticket
category: Customer support
audience: Support teams and business owners
related_pack: Customer Support Pack
price: free
status: published
tested: true
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

### Input used

**{{ticket}}**
~~~~
Ticket #48213. From: Marcus Reyes (marcus@reyesbikes.example), Reyes Bike Shop.
"Hi, I uploaded my product CSV yesterday and it said import complete but none of my 340 products show up in Inventory. My number is 555-0147 if you want to call. Please help, I'm opening Saturday."

Reply from Priya (Support):
"Hi Marcus, thanks for the details. The import went into the Drafts tab. Imports with a blank SKU column are saved as drafts instead of being published. Go to Inventory > Drafts and you'll see all 340 there. Click Select All, then Fix Missing SKUs (top right) and choose Auto-generate. Then click Publish. They'll move to the Active tab. For next time, make sure the SKU column in your CSV isn't empty before you upload. Let me know if any don't publish. Priya"
~~~~

**{{product}}**
~~~~
Tallybox, a web-based inventory app for small retail shops
~~~~

### Output

~~~~
TITLE
My imported products are not showing in Inventory

ANSWER
Products imported with a blank SKU column are saved in the Drafts tab, so fix the SKUs there and publish them to move them to Active.

STEPS
1. In Tallybox, go to Inventory > Drafts.
2. Check that your imported products are listed there.
3. Click Select All.
4. Click Fix Missing SKUs (top right).
5. Choose Auto-generate.
6. Click Publish.

WHAT YOU SHOULD SEE
Your products leave the Drafts tab and appear in the Active tab.

IF THAT DID NOT WORK
- Some products are still in Drafts. They may be missing something other than a SKU. [VERIFY: which other fields are required to publish.] Try: open one remaining product in Drafts and look for any highlighted or empty field, fill it in, and click Publish again.
- You are looking at the wrong list. [VERIFY: whether the Active tab has filters that can hide products.] Try: check that no filter is applied, then refresh the page and open the Active tab again.

PREVENT THIS NEXT TIME
Before you upload a CSV, make sure the SKU column is not empty.

WHEN TO CONTACT SUPPORT
Contact support if products still will not publish after the steps above. [VERIFY: confirm what support needs.] Include: the email on your account, the name of the file you imported and roughly when, how many products you expected, how many appear in Drafts and in Active, and a screenshot of the Drafts tab.

THREE ALTERNATIVE TITLES
- Why did my CSV import say complete but my products are missing?
- Imported products are in Drafts instead of Active
- How to publish products after a CSV import

FIVE SEARCH PHRASES THIS ARTICLE SHOULD MATCH
- csv import complete but no products showing
- imported products stuck in drafts
- fix missing SKUs after import
- products not appearing in inventory after upload
- how to publish draft products
~~~~
