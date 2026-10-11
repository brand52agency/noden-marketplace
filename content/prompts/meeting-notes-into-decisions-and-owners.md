---
id: N152
type: prompt
title: "Meeting notes into decisions and owners"
slug: meeting-notes-into-decisions-and-owners
category: Operations
audience: Owners and operations leads
related_pack: none
price: free
status: drafted
tested: false
---

## What it's for
Leave every meeting with a clear record.

## Fill in
- `{{notes}}`: raw notes or a transcript
- `{{attendees}}`: who was there

## Prompt

```
Turn these meeting notes into a clear record.

Notes:
{{notes}}

Attendees: {{attendees}}

Give me:
1. Decisions made, one per line.
2. Action items as a table: task, owner, due date.
3. Open questions that were raised but not settled.
4. A three-sentence summary for people who were not there.
5. A short follow-up message I can send to the group.

Rules:
- Record only what the notes support. Do not assign an owner or date that was not stated. Use [OWNER?] or [DATE?] instead.
- Keep people's positions accurate and neutral.
- If two parts of the notes conflict, show both and flag it.
```

## Example output
TODO: run this prompt once with a realistic input and paste the real output here. Do not write an example by hand.
