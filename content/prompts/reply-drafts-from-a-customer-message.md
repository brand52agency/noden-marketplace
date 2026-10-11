---
id: N126
type: prompt
title: "Reply drafts from a customer message"
slug: reply-drafts-from-a-customer-message
category: Customer support
audience: Support teams and business owners
related_pack: Customer Support Pack
price: free
status: published
tested: true
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

### Input used

**{{message}}**
~~~~
Hi, I dropped my commuter bike off Thursday for a basic tune up. The guy at the counter said it'd be ready Monday. It's now Wednesday and I haven't heard anything. I've been taking the bus all week and I really need the bike back. This is the second time I've had to chase you guys for an update. Can someone just tell me where it is? Jordan
~~~~

**{{policy}}**
~~~~
Standard tune-ups take 3 to 5 business days, and up to 7 in spring and summer. We text customers when a bike is ready. If we miss a quoted pickup date by more than 2 days, we take 10% off the repair. We cannot offer loaner bikes or cover transport costs. Pickups are Tuesday to Saturday, 9 to 5.
~~~~

**{{voice}}**
~~~~
Friendly, plain-spoken, a little dry humor. First names, short sentences, no corporate phrases.
~~~~

### Output

~~~~
**What they're asking and how they feel**
They want to know where their bike is, since it was promised for Monday and nobody has been in touch. They feel frustrated and let down, and this is their second time chasing us.

**A. Brief**
Hi Jordan, I can't see from here where your bike is, so I'm checking the bench right now. I'll text you by [TIME TODAY] with where it is and a pickup day. Sorry you've been on the bus all week. Could you reply with the phone number on your ticket? That helps.

[YOUR NAME], Camber & Chain

**B. Standard**
Hi Jordan, your bike was promised for Monday, and you shouldn't have had to chase us for an update. I can't tell you its exact spot yet, so I'm going to the bench now to find it.

I'll text you by [TIME TODAY] with its status and a pickup day. We're open Tuesday to Saturday, 9 to 5, if you'd like to come in. Could you reply with the phone number on your ticket and a quick description of the bike? That gets me to it faster.

[YOUR NAME], Camber & Chain

**C. Extra care**
Hi Jordan, I hear you. A week on the bus with your bike sitting in our shop is a bad deal, and getting no word since Monday makes it worse. I can't tell you exactly where it is yet, so I'm going to find it myself right now, not pass you along.

I'll text you by [TIME TODAY] with where it is and the day you can pick it up. I'll also tell the team to update you directly if that day moves. If you can reply with the phone number on your ticket and a quick description of the bike, I'll find it faster.

[YOUR NAME], Camber & Chain

**Notes before you send**
- Our policy does not say how to look up a bike's status, so all three replies are holding replies that commit only to finding out. Fill in [TIME TODAY] with a time you can keep.
- The 10% discount applies only when we miss the quoted date by more than 2 days. Wednesday is exactly 2 days past Monday, so it isn't triggered yet and I have not mentioned it. It will apply from tomorrow if the bike is still not ready.
- The policy does not cover loaner bikes or transport costs, so none are offered.

**Information to get from the customer**
- The phone number on the ticket (and the ticket or tag number if they have it)
- Their last name (we only have "Jordan")
- A short description of the bike
- The date and who they dropped it off with, if they remember
~~~~
