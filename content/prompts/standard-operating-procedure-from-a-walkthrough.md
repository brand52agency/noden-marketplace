---
id: N151
type: prompt
title: "Standard operating procedure from a walkthrough"
slug: standard-operating-procedure-from-a-walkthrough
category: Operations
audience: Owners and operations leads
related_pack: none
price: free
status: published
tested: true
---

## What it's for
Get a process out of someone's head and onto a page.

## Fill in
- `{{walkthrough}}`: a rough description or transcript of how the task is done
- `{{role}}`: who will follow this procedure

## Prompt

```
Turn this walkthrough into a standard operating procedure.

Walkthrough:
{{walkthrough}}

Who will follow it: {{role}}

Write the procedure with: purpose in one sentence, when to use it, what you need before starting, numbered steps with one action each, what "done" looks like, common mistakes and how to avoid them, and who to ask when something is off.

Rules:
- Keep the order of steps from the walkthrough unless a step clearly depends on a later one. If you reorder, say why.
- Where the walkthrough skips something a new person would need, insert [MISSING: what is needed] instead of guessing.
- Write for someone doing this for the first time.
- End with a list of questions for the person who gave the walkthrough.
```

## Example output

### Input used

**{{walkthrough}}**
~~~~
ok so closing out the register. first around 8:45 I run the Z report on the Square terminal - hold on menu, reports, end of day or whatever its called, I always forget. then I count the drawer, we leave $200 in there for the morning and everything else goes in the bank bag. I count twice cuz Priya got it wrong once. there's a form on the clipboard, the cash log, write the date, the total sales from the report, cash counted, and sign. if its off by more than like five bucks I tell Marcus... no wait Marcus is the day manager, tell Renata, she's the owner. oh and before the count wipe down the counter and take the tip jar out. tips get split Friday not daily. bank bag goes in the safe in the back office, code is on a sticky inside the cabinet I think. then turn off the card reader and lock the drawer, key goes on the hook. oh and I print the Z report and staple it to the cash log. Sunday we dont deposit, Monday Renata or Marcus does the bank run.
~~~~

**{{role}}**
~~~~
New part-time front-of-house staff doing their first closing shift at Juniper Street Bakery
~~~~

### Output

~~~~
**Standard Operating Procedure: End-of-Day Register Close-Out**

**Purpose**
To count the day's cash, match it to the day's sales report, and secure the money safely at closing.

**When to use it**
At the end of every day we are open, around 8:45 pm, after the last customer has left. Do not deposit at the bank on Sundays; the money stays in the safe until Monday.

**What you need before starting**
- The register and the Square terminal
- The clipboard with the cash log form
- A pen
- The bank bag
- The key to the cash drawer (it hangs on the hook)
- A printer connected to the terminal and paper in it
- A stapler
- [MISSING: the safe code or where it is kept. The walkthrough says a sticky note inside a cabinet, but the speaker wasn't sure]

**Steps**
1. Wipe down the counter. (I moved this step before the count: the walkthrough said it should happen before the count, even though it was mentioned later.)
2. Take the tip jar off the counter. [MISSING: where the tip jar goes overnight]
3. On the Square terminal, open the menu and go to Reports. [MISSING: the exact name of the end-of-day report option; the walkthrough says "end of day or whatever"]
4. Run the Z report.
5. Print the Z report.
6. Count the cash in the drawer once.
7. Count it a second time, to check.
8. Leave $200 in the drawer for the morning. [MISSING: which bills and coins make up the $200]
9. Put all the rest of the cash in the bank bag. [MISSING: whether the bag is sealed or labeled, and whether the cash needs to be in any order]
10. On the cash log, write the date.
11. On the cash log, write the total sales from the Z report.
12. On the cash log, write the cash you counted.
13. Sign the cash log.
14. Compare the counted cash to the sales total. If they are more than about five dollars apart, tell Renata. [MISSING: the exact amount, whether this means over, under or both, and how to reach Renata at night]
15. Staple the printed Z report to the cash log.
16. Put the bank bag in the safe in the back office.
17. Turn off the card reader. [MISSING: how it is turned off, and whether it needs to be unplugged]
18. Lock the cash drawer.
19. Hang the key on the hook.

**What "done" looks like**
The drawer is locked with $200 in it and the key is on the hook. The bank bag is in the safe. The cash log is filled in, signed, and has the printed Z report stapled to it. The card reader is off. The counter is wiped and the tip jar is put away.

**Common mistakes and how to avoid them**
- Miscounting the cash. Count twice, as the walkthrough says; someone got it wrong once.
- Splitting or paying out tips at close. Tips are split on Friday, not daily. [MISSING: where tips are kept until Friday]
- Forgetting to staple the Z report to the log. Do the stapling before you leave the counter.
- Depositing on a Sunday. Don't; leave it in the safe.
- Leaving the drawer unlocked or the key off the hook. Check both last.

**Who to ask when something is off**
Renata, the owner, for count differences. Marcus is the day manager and does the Monday bank run, so ask him about daytime questions. [MISSING: phone numbers or the preferred way to reach either of them]

**Questions for the person who gave the walkthrough**
1. What is the exact name of the end-of-day report in the Square menu?
2. Where is the safe code kept, and does it ever change?
3. What are the exact amounts for the $200 left in the drawer?
4. What counts as "off": is it five dollars over, under, or either? What should the person do if it is off by less than that?
5. Does the bank bag get sealed or labeled, and does it need a deposit slip?
6. Where does the tip jar go overnight, and who handles the Friday split?
7. Who does the bank run on Mondays, Renata or Marcus, and what time?
8. How do you turn off the card reader, and does anything else need turning off, such as lights, ovens or the door lock?
9. What should a new person do if the Z report won't print?
10. Are there other closing tasks that were left out, such as the front door?
~~~~
