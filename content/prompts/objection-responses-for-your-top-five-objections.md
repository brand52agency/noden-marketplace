---
id: N103
type: prompt
title: "Objection responses for your top five objections"
slug: objection-responses-for-your-top-five-objections
category: Sales
audience: Founders and sales teams
related_pack: Sales Outreach Pack
price: free
status: published
tested: true
---

## What it's for
Stop improvising when buyers push back.

## Fill in
- `{{offer}}`: what you sell
- `{{objections}}`: the five objections you hear most
- `{{proof}}`: real results or examples you can cite

## Prompt

```
Help me respond to common objections.

What I sell: {{offer}}
The objections I hear most:
{{objections}}
Proof I can honestly cite: {{proof}}

For each objection give:
- What the buyer is probably worried about underneath.
- A clarifying question to ask before answering.
- A response under 60 words that acknowledges the concern, then addresses it.
- Which piece of my proof fits, if any.
- When the honest answer is "we may not be the right fit", and how to say that.

Rules:
- No pressure tactics, false scarcity or disparaging competitors.
- Use only the proof I provided. If none fits an objection, say so and suggest what proof I should collect.
```

## Example output

### Input used

**{{offer}}**
~~~~
Monthly bookkeeping plus quarterly tax estimates for solo contractors (electricians, plumbers, remodelers) with 0 to 3 employees. Flat $325 a month, run by my small firm, Ledgerline Books.
~~~~

**{{objections}}**
~~~~
1. "$325 a month is a lot, I can just keep a spreadsheet myself."
2. "I don't want to give my bank logins to someone I just met."
3. "My wife already does the books."
4. "I'm too busy to send you receipts and invoices every month."
5. "What if you get my taxes wrong?"
~~~~

**{{proof}}**
~~~~
- A client electrician went from five weeks behind on his books to books closed by the 10th of every month, for the last 14 months.
- Across the 14 clients who joined last year, our first-year catch-up work found an average of $2,100 per client in business expenses they had not been deducting.
- We prepared 31 returns in the last two filing seasons and none has drawn an IRS notice.
~~~~

### Output

~~~~
**Objection 1: "$325 a month is a lot, I can just keep a spreadsheet myself."**
- Underneath: Is this a cost or an investment? He fears paying for something he can do for free, and may not know what he is missing.
- Ask first: "What does your spreadsheet cover today, and when did you last reconcile it to the bank?"
- Response: Fair question. If you keep the spreadsheet current, you may be fine. Where clients have come out ahead is the expenses that slip through: across 14 clients last year, our catch-up work found an average of $2,100 each in expenses not yet deducted.
- Proof that fits: The $2,100 average in missed expenses from the 14 first-year clients.
- Honest "not the right fit": If his books are already current, his income is low enough that $325 a month outweighs any savings, and he is comfortable with the work, say: "It sounds like you have this covered. If it starts to slip, or tax time gets stressful, come back."

**Objection 2: "I don't want to give my bank logins to someone I just met."**
- Underneath: Fear of fraud or losing control of the money, and no basis yet to trust you.
- Ask first: "What would you need to see to feel comfortable, a read-only connection, uploads you control, or something else?"
- Response: That's a sensible worry. Here is exactly how access works with us: [describe your actual setup, e.g. read-only connections, who sees what, how to revoke]. You can start with a statement upload and decide on a connection later.
- Proof that fits: None of your three proof items addresses security. Collect: your actual access setup in writing, and a short quote from a current client on how they felt handing over access.
- Honest "not the right fit": If he will not share any financial data in any form, say: "Then we can't do the work properly, and I'd rather tell you that now than do a half job."

**Objection 3: "My wife already does the books."**
- Underneath: Loyalty and not wanting to imply she is doing a poor job; also not wanting to pay for something already covered.
- Ask first: "What parts does she handle, and which parts, if any, does she dread or find stressful?"
- Response: That's great that she's keeping on top of it. Some owners keep her in the loop and use us for the quarterly estimates and year-end, so it isn't all or nothing. Would a smaller scope be a better fit?
- Proof that fits: None directly. Collect: a story from a client whose spouse or relative kept the books before they joined, if one exists, and what changed.
- Honest "not the right fit": If she is handling the books and the quarterly estimates well, say: "Then you don't need us. If her time becomes the bottleneck, I'm here."

**Objection 4: "I'm too busy to send you receipts and invoices every month."**
- Underneath: He worries this adds work. He has probably already fallen behind and is a bit embarrassed.
- Ask first: "How do receipts and invoices get saved today, and how far behind are you?"
- Response: Understood, that's exactly when paperwork piles up. One client was five weeks behind when he started and has had his books closed by the 10th of every month for 14 months. We can agree a simple monthly routine up front.
- Proof that fits: The electrician who went from five weeks behind to closing by the 10th for 14 months.
- Honest "not the right fit": If he will not commit to even a minimal monthly routine, say: "Without a bit of input each month, I can't keep your books accurate, so this wouldn't serve you well."

**Objection 5: "What if you get my taxes wrong?"**
- Underneath: Fear of penalties, audit and being blamed; he wants to know who is accountable.
- Ask first: "Have you had a notice or a correction before, and what happened?"
- Response: A reasonable fear. We prepared 31 returns across the last two filing seasons, and none has drawn an IRS notice. I can also walk you through how each return gets reviewed before it's filed: [describe your review step].
- Proof that fits: 31 returns over two filing seasons with no IRS notices. Do not describe that as a guarantee.
- Honest "not the right fit": If he has complex issues outside your scope (for example multi-state payroll or an open audit), say: "That's beyond what we handle. You'd be better served by [type of specialist]."
~~~~
