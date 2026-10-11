---
id: N128
type: prompt
title: "Refund and return response set"
slug: refund-and-return-response-set
category: Customer support
audience: Support teams and business owners
related_pack: Customer Support Pack
price: free
status: drafted
tested: false
---

## What it's for
Handle refund requests consistently.

## Fill in
- `{{policy}}`: your refund and return policy
- `{{business}}`: what you sell

## Prompt

```
Write a set of refund and return replies based on this policy.

Policy:
{{policy}}

Business: {{business}}

Write one reply for each case, each under 110 words:
1. Request is within policy: approve and explain what happens next.
2. Request is just outside the policy window.
3. Item is used or not in returnable condition.
4. Customer wants a refund but policy offers exchange or credit only.
5. Request needs more information before a decision.
6. A goodwill exception is being made.

Rules:
- Stay strictly within the policy text. If the policy is silent on a case, say so and write a neutral holding reply.
- State timelines and amounts only if the policy gives them. Otherwise use [TIMEFRAME].
- Firm where the answer is no, with one alternative offered where the policy allows.
- Finish with a list of gaps in my policy that these cases exposed.
```

## Example output
TODO: run this prompt once with a realistic input and paste the real output here. Do not write an example by hand.
