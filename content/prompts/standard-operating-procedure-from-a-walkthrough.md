---
id: N151
type: prompt
title: "Standard operating procedure from a walkthrough"
slug: standard-operating-procedure-from-a-walkthrough
category: Operations
audience: Owners and operations leads
related_pack: none
price: free
status: drafted
tested: false
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
TODO: run this prompt once with a realistic input and paste the real output here. Do not write an example by hand.
