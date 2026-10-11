# Catalog skills (code-backed)

Listings with `Listing.handler` set are performed by code in `lib/skills/`, not by the model. Each does a real
lookup and returns structured data. Add one by writing a handler in `lib/skills/`, registering it in
`lib/skills/index.ts`, and defining it in `scripts/add-catalog-skills.ts` (schemas, price, sample input).
`npm run catalog:skills` runs a real test call for each and activates only those that pass
(`-- --dry-run` tests without writing).

| Skill | Source | Price | Credits |
|---|---|---|---|
| Agent-Readiness Check | the site's own files (home page, llms.txt, robots.txt, sitemap, JSON-LD, agent card, OpenAPI) | free | 0 |
| Web Page to Clean Data | the page itself | free | 0 |
| Domain Availability and DNS Lookup | RDAP (rdap.org) and live DNS | 60 sats | 5 |
| Live FX and Currency Conversion | ECB reference rates via Frankfurter (daily rates, rate date returned) | 60 sats | 5 |
| Dependency CVE Lookup | OSV.dev | 120 sats | 10 |
| Sitemap and Broken Link Crawler | the site's sitemap, up to 50 same-site URLs | 180 sats | 15 |

Not built yet (CATALOG_PLAN N293, N297, N299, N300): Receipt and Invoice to JSON (needs the upload path), Address
Geocoding (needs a provider decision and licence), Audio and Video Transcription (a paid speech model) and
Screenshot and Page-to-PDF Capture (a headless browser, which the current hosting can't run).

## Safety

- All fetching of caller-supplied URLs goes through `lib/safe-fetch.ts`: http/https on ports 80/443 only; every
  resolved address is checked at connect time and private, loopback, link-local, CGNAT, multicast and metadata
  ranges refused; at most 3 redirects, each re-checked; size and time capped; no decompression. Tests: `npm run test:safe-fetch`.
- Input is validated before any order exists or anything is fetched (HTTP 422).
- Paid skills cost Noden a few outbound requests, so they are priced for value, not tokens (`HANDLER_NOMINAL_COST_USD`
  in `lib/credits.ts`).
- Free skills (`priceSats: 0`) are limited in `lib/free-skills.ts`: 25/day per verified account, 5/day per IP for anonymous
  keys (4x that per /24), a global daily ceiling (`FREE_SKILL_GLOBAL_DAILY`, default 2000), and kill switches
  `FREE_SKILLS_ENABLED=false` and `FREE_SKILLS_DISABLED=handler-key,...`. Tests: `npm run test:free-skills`.
