---
id: N101
type: prompt
title: "Discovery call question list"
slug: discovery-call-question-list
category: Sales
audience: Founders and sales teams
related_pack: Sales Outreach Pack
price: free
status: published
tested: true
---

## What it's for
Walk into a first call knowing what to ask.

## Fill in
- `{{offer}}`: what you sell
- `{{prospect}}`: who you are meeting and what you know about them
- `{{call_length}}`: minutes available

## Prompt

```
Prepare me for a discovery call.

What I sell: {{offer}}
Who I am meeting: {{prospect}}
Call length: {{call_length}} minutes

Give me:
1. A one-line opening that sets the agenda.
2. Twelve questions grouped as: their situation, the problem and its cost, what they have tried, how they decide, and timing and budget. Order them so the easy ones come first.
3. For each question, what a strong answer and a weak answer would tell me.
4. Three signs this prospect is not a fit.
5. A closing that agrees a specific next step.
6. A time plan that fits the call length.

Rules:
- Questions must be open-ended and neutral. None that lead toward my product.
- Base anything about the prospect only on what I told you. Do not guess facts about their company.
```

## Example output

### Input used

**{{offer}}**
~~~~
Ledgerline Bookkeeping: cleanup of messy books plus monthly bookkeeping in QuickBooks Online for small trade and construction businesses. Fixed monthly fee, $450 to $900 depending on transaction volume.
~~~~

**{{prospect}}**
~~~~
Dana Whitfield, owner of Whitfield & Sons Roofing, a roofing company with about nine employees. Referred by her insurance agent. She told the agent her books are 'a mess' and her accountant keeps chasing her for reports in March. That is all I know.
~~~~

**{{call_length}}**
~~~~
30
~~~~

### Output

~~~~
DISCOVERY CALL PREP: Dana Whitfield, Whitfield & Sons Roofing, 30 minutes

1. OPENING LINE
"Thanks for making time, Dana. I'd like to spend the first part asking about how things work today, then tell you whether I can help, and leave us a clear next step. Sound okay?"

2. TWELVE QUESTIONS

A. Their situation
Q1. Can you walk me through how the business runs day to day, and where the money side fits in?
 Strong: a clear picture of who does what, and she knows where her numbers live. Weak: "it's all kind of in my head."
Q2. Who handles the bookkeeping right now, and what does a typical week of that look like?
 Strong: a named person or a clear routine. Weak: nobody owns it, or it only gets done when something is due.
Q3. What do you use today to track income and expenses?
 Strong: a tool she can name, ideally QuickBooks or something I can work from. Weak: paper, scattered spreadsheets, or no system.

B. The problem and its cost
Q4. What's been going on that makes the books a priority now?
 Strong: a specific trigger, like a tax deadline or a bad surprise. Weak: "I should probably deal with it."
Q5. When the books fall behind, what does that affect for you?
 Strong: she can name concrete effects such as cash decisions, taxes or the accountant's deadlines. Weak: she cannot name any consequence, which suggests low urgency.
Q6. What has it cost you so far, in time, money or stress?
 Strong: numbers or clear examples (late fees, hours, accountant overtime). Weak: shrugs, which suggests she may not feel the cost yet.

C. What they have tried
Q7. What have you tried so far to fix it?
 Strong: she has made real attempts, so she knows what she wants. Weak: nothing tried, or a history of starting and abandoning fixes.
Q8. What worked about those attempts and what did not?
 Strong: specific lessons that shape how I scope the work. Weak: blames people or tools without detail.

D. How they decide
Q9. Besides you, who else would have a say in a decision like this?
 Strong: she names the people (for example her accountant) so I can include them. Weak: a hidden decision-maker appears late.
Q10. How have you chosen outside help for the business before?
 Strong: a clear process she can repeat. Weak: no process, or a pattern of delaying decisions.

E. Timing and budget
Q11. What timeline do you have in mind for getting this sorted, and what is driving it?
 Strong: a date tied to a real event. Weak: "sometime this year."
Q12. How are you thinking about what to invest in fixing this?
 Strong: a number or range, or a clear sense of what it is worth. Weak: no idea, or an expectation far below the work needed.

3. SIGNS THIS PROSPECT IS NOT A FIT
- She will not share access to her bank and accounting records, which I need to do the work.
- She wants tax preparation, payroll or advice, which are outside what I sell. [Confirm against your own scope.]
- She expects the books fixed with no involvement at all, and will not answer questions or send receipts.

4. CLOSING (agree a specific next step)
"Based on what you've told me, a good next step is a short records review: I look at your last few months in the books and send you a fixed-price scope. Can we book [day and time] for that, and would you like your accountant included?"

5. TIME PLAN (30 minutes)
- 0:00 to 0:02: Opening and agenda
- 0:02 to 0:08: Situation (Q1 to Q3)
- 0:08 to 0:16: Problem and cost (Q4 to Q6)
- 0:16 to 0:20: What they have tried (Q7, Q8)
- 0:20 to 0:24: How they decide (Q9, Q10)
- 0:24 to 0:27: Timing and budget (Q11, Q12)
- 0:27 to 0:30: Closing and next step

If time runs short, drop Q3, Q8 and Q10 first.
~~~~
