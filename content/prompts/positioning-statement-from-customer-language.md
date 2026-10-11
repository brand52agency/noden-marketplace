---
id: N177
type: prompt
title: "Positioning statement from customer language"
slug: positioning-statement-from-customer-language
category: Founder and strategy
audience: Founders
related_pack: Product Launch Pack
price: free
status: published
tested: true
---

## What it's for
Describe what you do in the words your buyers use.

## Fill in
- `{{customer_quotes}}`: things real customers have said about why they chose you
- `{{offer}}`: what you sell
- `{{alternatives}}`: what people would use instead

## Prompt

```
Write a positioning statement from real customer language.

What customers have said:
{{customer_quotes}}

What I sell: {{offer}}
What they would use instead: {{alternatives}}

Give me:
1. The themes in the quotes, with the exact phrases that support each.
2. Three positioning statements in the form: for [who], who [need], [name] is a [category] that [benefit], unlike [alternative], which [difference].
3. A plain one-sentence version of each for a website headline.
4. Which one you would pick and why.

Rules:
- Build only on what the quotes say. If I gave fewer than five quotes, tell me the result is weak and what to ask customers next.
- Do not claim to be the best, first or only unless a quote supports it.
```

## Example output

### Input used

**{{customer_quotes}}**
~~~~
1. "We used to wait two days for a callback. Now someone answers within the hour and they already know our setup." (office manager, 6-person dental practice)
2. "I'm not a tech person. They explain things without making me feel dumb." (dentist, solo practice)
3. "They set up our X-ray software so it just works, and they actually know what HIPAA means for a dental office." (office manager, orthodontic practice)
4. "The big IT company sent a different person every time. Here it's the same two people." (practice administrator)
5. "Our last guy was the owner's brother-in-law and he disappeared when the server crashed." (dentist, 4-chair practice)
6. "Flat monthly price, no surprise invoices. That alone was worth switching." (office manager)
~~~~

**{{offer}}**
~~~~
Brightline IT: flat-rate managed IT support for dental and orthodontic practices with 3 to 15 staff, handled by two named technicians.
~~~~

**{{alternatives}}**
~~~~
Big regional IT companies, a relative or freelancer on call, or having the office manager deal with it.
~~~~

### Output

~~~~
**1. Themes in the quotes**

*Fast answers from people who know the office*
- "someone answers within the hour and they already know our setup"
- "the same two people" (vs. "a different person every time")
- "We used to wait two days for a callback"

*Plain talk, not jargon*
- "They explain things without making me feel dumb"
- "I'm not a tech person"

*Dental-specific know-how*
- "They set up our X-ray software so it just works"
- "they actually know what HIPAA means for a dental office"

*Dependability when something breaks*
- "he disappeared when the server crashed" (the previous informal helper)
- "so it just works"

*Predictable cost*
- "Flat monthly price, no surprise invoices"
- "That alone was worth switching"

**2. Three positioning statements**

A. For dental practices with 3 to 15 staff, who need IT problems fixed quickly by people who already know their office, Brightline IT is a managed IT support provider that answers within the hour with one of two named technicians, unlike big regional IT companies, which send a different person every time.

B. For dental and orthodontic practices who need their X-ray and practice systems to just work, Brightline IT is a managed IT support provider that understands what HIPAA means for a dental office, unlike a relative or freelancer on call, who may not be there when the server crashes.

C. For practice owners and office managers who are not tech people, Brightline IT is a flat-rate IT support provider that explains things plainly and charges one monthly price, unlike a previous provider that sent surprise invoices.

Notes: "within the hour" comes from one customer, so only use it publicly if it is your actual standard. Quote 3 supports "knows what HIPAA means", not "HIPAA compliant", so do not claim compliance. Quote 6 does not say which alternative sent surprise invoices, so statement C names "a previous provider" instead of a specific alternative.

**3. One-sentence website headline versions**
- A: "IT support that answers within the hour, from two people who already know your office."
- B: "IT for dental offices that keeps your X-ray software running and knows what HIPAA means for you."
- C: "One flat monthly price for dental office IT. No surprise invoices, no jargon."

**4. My pick: A**
It rests on the strongest cluster in your quotes: quotes 1 and 4 both describe speed and knowing the people (a callback delay and a "different person every time"), and quote 5 backs it up from the other side (a helper who "disappeared"). B and C each rest on one or two quotes. Six quotes is enough to see themes, but they are all from dental offices and several are from one role, so ask more customers what first made them switch to confirm A before putting it on your site.
~~~~
