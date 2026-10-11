---
id: N128
type: prompt
title: "Refund and return response set"
slug: refund-and-return-response-set
category: Customer support
audience: Support teams and business owners
related_pack: Customer Support Pack
price: free
status: published
tested: true
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

### Input used

**{{policy}}**
~~~~
Returns: 30 days from delivery date for unused, unburned candles in original packaging. Refund goes to the original payment method within 5 to 7 business days after we receive the item back. Customer pays return shipping unless the item arrived damaged or we sent the wrong item. Items bought on sale can be exchanged or taken as store credit, not refunded. Opened gift sets are not returnable. Damaged items: email a photo within 7 days of delivery and we replace or refund. Personalized candles are final sale.
~~~~

**{{business}}**
~~~~
Tidewater Candle Co. - handmade soy candles and gift sets sold through our own online shop.
~~~~

### Output

~~~~
**1. Within policy**

Hi [NAME], thanks for getting in touch. Your return is within our 30-day window, so we're happy to take it back.

Please send the candle back unused, unburned and in its original packaging. Once it reaches us, your refund goes to your original payment method within 5 to 7 business days. Return shipping is paid by you, unless the item arrived damaged or was the wrong one.

[RETURN ADDRESS AND HOW TO START A RETURN]

Reply here if anything is unclear.

Tidewater Candle Co.

**2. Just outside the window**
Note: Policy states the window but is silent on what happens after it, so no alternative is offered.

Hi [NAME], thanks for getting in touch, and I understand wanting a straight answer. Our returns window is 30 days from delivery. Your order arrived on [DELIVERY DATE], which puts it just past that window, so I can't accept the return or issue a refund.

I know that's not what you hoped to hear, and I appreciate you understanding. If anything else about your order doesn't look right, reply and tell me.

Tidewater Candle Co.

**3. Used or not returnable**
Note: Policy is silent on a candle that is lit and also defective; only the damaged/wrong-item route is mentioned.

Hi [NAME], thanks for telling us what happened. We accept returns only on candles that are unused, unburned and in their original packaging, so a candle that has been lit can't be returned or refunded.

If it arrived damaged or was the wrong item, email us a photo within 7 days of delivery and we'll replace or refund it. If neither applies, I'm not able to offer a return on this one.

Tidewater Candle Co.

**4. Refund wanted, policy allows exchange or credit only**

Hi [NAME], thanks for your message. The [ITEM] was bought on sale, and sale items can be exchanged or taken as store credit, but not refunded. So I can't return the money to your card.

I can do either of these: swap it for another item, or issue store credit within [TIMEFRAME]. Tell me which you'd like and I'll set it up. The candle should be unused and unburned, in its original packaging.

Tidewater Candle Co.

**5. More information needed**

Hi [NAME], thanks for writing. I want to give you the right answer, and I need a few details first.

Could you reply with your order number, the date it arrived, whether you're asking for a return, refund or exchange, and a photo if it arrived damaged or wrong? Damage photos need to reach us within 7 days of delivery.

Once I have those, I'll come back to you with a decision within [TIMEFRAME].

Tidewater Candle Co.

**6. Goodwill exception**
Note: Policy is silent on goodwill exceptions, so this reply is a neutral template with placeholders for what you decide.

Hi [NAME], thank you for your patience. Your request falls outside our standard policy, but we've decided to make an exception for you this time.

Here's what we'll do: [WHAT YOU ARE OFFERING: refund, credit or exchange]. Please [RETURN INSTRUCTIONS, IF ANY], and it will be processed within [TIMEFRAME].

This is a one-time exception, and our usual policy applies to future orders. Thank you for being a customer.

Tidewater Candle Co.

**Gaps in your policy that these cases exposed**
- No alternative is stated for returns after day 30 (store credit, a short grace period, or nothing).
- No process for starting a return: where to send it, whether you provide a label, who to contact.
- No store credit details: when it is issued, whether it expires, and whether it can be used on sale items.
- Unclear whether the 30-day window also applies to sale-item exchanges and credit.
- Nothing on a candle that is defective after burning (for example tunneling or a wick fault), as distinct from damaged on arrival.
- Nothing on goodwill exceptions: who can approve one, and what form it can take.
- Nothing on exchanges: who pays shipping, and what happens if the replacement is out of stock.
- Unclear whether original outbound shipping is refunded.
- No timeframe for how fast you respond to requests or damage photos.
- Nothing on partial refunds, for example a gift set returned with one candle missing.
~~~~
