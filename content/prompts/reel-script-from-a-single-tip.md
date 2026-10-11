---
id: N026
type: prompt
title: "Reel script from a single tip"
slug: reel-script-from-a-single-tip
category: Video and reels
audience: Creators and small business owners
related_pack: Reel and Short Video Pack
price: free
status: published
tested: true
---

## What it's for
Turn one useful tip into a short video you can film today.

## Fill in
- `{{tip}}`: the one thing you want viewers to learn
- `{{business}}`: what you do
- `{{length}}`: target seconds, such as 20 or 30

## Prompt

```
Write a short vertical video script that teaches one tip.

Tip: {{tip}}
Business: {{business}}
Target length: {{length}} seconds

Give me a table with columns: time, what I say, what is on screen, on-screen text.
Structure:
- 0 to 3 seconds: a hook that states the problem or the payoff.
- Middle: the tip in at most three steps, one sentence each.
- Last 3 seconds: one call to action.

Rules:
- Spoken words must fit the time at a natural pace, about 2.5 words per second.
- On-screen text is at most six words per line.
- Assume one person filming on a phone with no editing skills. No shots that need a second person.
- After the table, write the caption and list what I need to have ready before filming.
```

## Example output

### Input used

**{{tip}}**
~~~~
After you wash a cast iron pan, dry it on low heat, then wipe a thin layer of oil on while it's still warm. That stops rust and you almost never have to do a full re-season.
~~~~

**{{business}}**
~~~~
Ridgeback Iron Co. - I restore and sell vintage cast iron pans online and at weekend markets.
~~~~

**{{length}}**
~~~~
30
~~~~

### Output

~~~~
| Time | What I say | On screen | On-screen text |
|---|---|---|---|
| 0-3s | "Stop re-seasoning your cast iron." (5 words) | Close-up of a dull, spotty pan held in both hands, then set on the stove | Stop re-seasoning it |
| 3-10s | "Dry the pan on low heat until the water's gone." (10 words) | Pan on a burner on low; a little steam rises off the surface | Step 1: Dry on low heat |
| 10-17s | "Turn off the heat and add half a teaspoon of oil." (11 words) | Hand pours a small amount of oil into the warm pan | Step 2: Oil while warm |
| 17-27s | "Wipe it all over with a paper towel until it looks almost dry." (13 words) | Hand wipes the inside, sides and handle; end on a pan with an even dark sheen | Step 3: Wipe it thin |
| 27-30s | "Follow Ridgeback Iron for more cast iron tips." (8 words) | Pan sits on the counter next to a shelf of your restored pans | Follow for more tips |

Word count check: 5 + 10 + 11 + 13 + 8 = 47 spoken words, roughly 19 seconds of speech at 2.5 words per second. That leaves natural pauses for the visuals in a 30-second video, so you can speak slowly.

**Caption**
Rusty cast iron usually isn't a seasoning problem, it's a drying problem. Dry it on low heat, add a few drops of oil while it's still warm, wipe it thin, and you're done. Save this for the next time you wash your pan. #castiron #castironcare #cookingtips #kitchentips

**Have ready before filming**
- One cast iron pan, washed and ready to dry
- A stove burner you can set to low
- Cooking oil in a small cup or bottle, about half a teaspoon measured out
- A paper towel
- Your phone propped at chest height on a stack of books, pointing at the stove, so both hands are free
- A second, restored pan on a shelf or counter for the last shot
- Good daylight from a window, with the light on the pan and not behind it
~~~~
