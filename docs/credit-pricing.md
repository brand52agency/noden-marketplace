# Credit pricing and unit economics

Generated 2026-10-11 by `npm run credits:generate` from the live catalog (173 active listings). Do not edit by hand.

## How a credit price is set

1 credit = $0.01 of marketplace spend. A listing's credits are the **highest** of:

1. its sats price at a fixed reference rate ($83,000 per BTC, rounded up);
2. the minimum of 5 credits per call;
3. enough credits that the **worst allowed call** still keeps 20% gross margin at the cheapest credit Noden sells.

Rule 3 only holds because `createOrder` rejects any input over 24,000 characters (and any request body over 100 KB) before a model is called.

## What a call costs Noden

Fulfillment is one Claude Haiku 4.5 call with a forced tool call ($1 per million input tokens, $5 per million output tokens). Output is capped at 2,048 tokens, so output can never cost more than 1.02¢. Estimates use 3 characters per token (conservative), 580 fixed prompt tokens, the listing's own prompt and output schema, and a typical input of 1,500 characters.

- Typical call: up to **0.48¢** across the catalog.
- Worst allowed call (max input, max output): up to **2.05¢**.

## What Noden earns per credit

| Credit source | Price | Credits | Gross per credit | Net per credit (after card fees) |
|---|---|---|---|---|
| Starter, monthly | $9 | 1,000 | 0.90¢ | 0.84¢ |
| Starter, annual | $90 | 12,000 | 0.75¢ | 0.72¢ |
| Builder, monthly | $29 | 4,000 | 0.73¢ | 0.69¢ |
| Builder, annual | $290 | 48,000 | 0.60¢ | 0.58¢ |
| Pro, monthly | $79 | 12,000 | 0.66¢ | 0.63¢ |
| Pro, annual | $790 | 144,000 | 0.55¢ | 0.53¢ |
| Top-up 1,000 | $12 | 1,000 | 1.20¢ | 1.13¢ |
| Top-up 5,000 | $55 | 5,000 | 1.10¢ | 1.05¢ |
| Top-up 12,000 | $120 | 12,000 | 1.00¢ | 0.96¢ |

Cheapest net credit is 0.53¢. Pricing assumes **0.50¢** (5% lower, for tax, refunds and chargebacks). Card fees are 2.9% + 30¢ plus ~0.7% Stripe Billing; Lightning has no meaningful fee.

## Result

- Credit prices range 5–42 credits. Distribution: 5 credits × 76, 6 credits × 71, 7 credits × 5, 8 credits × 7, 9 credits × 1, 10 credits × 4, 11 credits × 2, 12 credits × 1, 13 credits × 1, 14 credits × 1, 15 credits × 1, 17 credits × 1, 38 credits × 1, 42 credits × 1.
- Lowest margin at the floor: **25%** on the worst possible call, **81%** on a typical call.
- 58 listings are priced above their sats-derived price because of cost.

## Failed checks and free retries

A failed check returns no output and no sats; the buyer gets a retry token for one free call (up to 2 per payment, 24 hours). That cap makes the exposure finite: one payment can trigger at most 3 model calls.

- **Realistic:** if 10% of calls fail, expected cost per paid call rises about 11%. Typical margins (at least 81%) absorb that easily.
- **Deliberate abuse** (input crafted to fail every attempt, maximum size and output): up to 3 × 2.05¢ = 6.15¢ of compute against one payment. Against the sats price that is a loss on 98 of 173 listings, at most 1.98¢ per abusive payment, and each abusive payment still costs the attacker the full price. Failed-call rate limits per key (NODEN_PRICING_TASKS.md F4) are still needed to cap this per hour.
- Free-trial calls are bounded the same way: one trial plus at most two free retries (3 calls) per verified email.

## Per listing

| Listing | Category | Sats | Credits | Typical cost | Worst-case cost | Typical margin | Worst margin | Input bounded by schema |
|---|---|---|---|---|---|---|---|---|
| API Response Schema Inferrer | Dev Tools | 50 | 6 | 0.39¢ | 2.03¢ | 87% | 33% | no (capped) |
| Abandoned Cart Recovery Copy Agent | E-commerce | 50 | 6 | 0.19¢ | 2.02¢ | 94% | 33% | no (capped) |
| Ad Copy Generator | Marketing | 50 | 5 | 0.36¢ | 1.41¢ | 86% | 44% | yes |
| Ad Copy Variant Generator with Angle Testing | Marketing | 50 | 5 | 0.38¢ | 1.58¢ | 85% | 37% | yes |
| After-Hours & Pre-Market Gap Risk Assessor | Finance | 50 | 6 | 0.45¢ | 2.04¢ | 85% | 32% | no (capped) |
| Audio Transcription Agent | Media | 50 | 5 | 0.38¢ | 1.26¢ | 85% | 50% | yes |
| Blog Outline Generator | Writing | 50 | 5 | 0.36¢ | 1.40¢ | 86% | 44% | yes |
| Brand Voice Consistency Checker | Marketing | 50 | 5 | 0.38¢ | 1.41¢ | 85% | 44% | yes |
| CI Pipeline Failure Diagnoser | DevOps | 50 | 5 | 0.21¢ | 1.25¢ | 92% | 50% | yes |
| CI Pipeline Failure Root-Cause Summarizer | DevOps | 50 | 5 | 0.29¢ | 1.58¢ | 88% | 37% | yes |
| CSV / JSON Schema Validator & Cleaner | Data | 50 | 6 | 0.44¢ | 2.03¢ | 85% | 33% | no (capped) |
| Calendar Scheduling Optimizer Agent | Productivity | 50 | 6 | 0.21¢ | 2.02¢ | 93% | 33% | no (capped) |
| Candidate Interview Question Generator | HR | 50 | 5 | 0.36¢ | 1.41¢ | 86% | 44% | yes |
| Canned Response Generator | Customer Support | 50 | 5 | 0.19¢ | 1.40¢ | 92% | 44% | yes |
| Coinbase Advanced Trade Post-Only & Time-in-Force Selector | Finance | 50 | 6 | 0.27¢ | 2.03¢ | 91% | 33% | no (capped) |
| Coinbase Fee Tier & Maker-Taker Optimizer | Finance | 50 | 6 | 0.42¢ | 2.03¢ | 86% | 32% | no (capped) |
| Coinbase Product ID & Precision Validator | Finance | 50 | 5 | 0.42¢ | 1.42¢ | 83% | 43% | yes |
| Cold Email Personalizer | Sales | 50 | 5 | 0.19¢ | 1.40¢ | 92% | 44% | yes |
| Contract Renewal Tracker | Procurement | 50 | 5 | 0.23¢ | 1.25¢ | 91% | 50% | yes |
| Cross-Venue Order Router (Robinhood vs Coinbase) | Finance | 50 | 6 | 0.44¢ | 2.03¢ | 85% | 32% | no (capped) |
| Daily Standup Digest Agent | Productivity | 50 | 5 | 0.38¢ | 1.25¢ | 85% | 50% | yes |
| Data Dictionary & Column Semantics Generator | Data | 50 | 5 | 0.40¢ | 1.27¢ | 84% | 49% | yes |
| Delivery ETA Confidence Scorer | Logistics | 50 | 6 | 0.27¢ | 2.03¢ | 91% | 33% | no (capped) |
| Delivery ETA Predictor | Logistics | 50 | 5 | 0.19¢ | 1.56¢ | 92% | 38% | yes |
| Dividend Capture & Ex-Date Risk Checker | Finance | 50 | 6 | 0.42¢ | 2.03¢ | 86% | 32% | no (capped) |
| Dockerfile Best-Practice Auditor | Dev Tools | 50 | 5 | 0.42¢ | 1.42¢ | 83% | 43% | yes |
| Domain & Trademark Availability Checker | Research | 50 | 6 | 0.21¢ | 2.02¢ | 93% | 33% | no (capped) |
| Earnings-Implied Move vs Historical Move Comparator | Finance | 50 | 6 | 0.24¢ | 2.03¢ | 92% | 33% | no (capped) |
| Email Subject Line Optimizer | Marketing | 50 | 5 | 0.38¢ | 1.25¢ | 85% | 50% | yes |
| Email Tone Polish Agent | Writing | 50 | 5 | 0.19¢ | 1.40¢ | 92% | 44% | yes |
| Employee Onboarding Checklist Agent | HR | 50 | 5 | 0.36¢ | 1.41¢ | 86% | 44% | yes |
| Employee Onboarding Timeline & Task Generator | HR | 50 | 6 | 0.39¢ | 2.03¢ | 87% | 33% | no (capped) |
| Exit Interview Theme Analyzer | HR | 50 | 6 | 0.44¢ | 2.03¢ | 85% | 33% | no (capped) |
| Expense Categorization Agent | Finance | 50 | 6 | 0.36¢ | 2.02¢ | 88% | 33% | no (capped) |
| FX & Currency Conversion Agent | Finance | 50 | 5 | 0.21¢ | 1.41¢ | 92% | 44% | yes |
| Financial Ratio Calculator Agent | Finance | 50 | 6 | 0.19¢ | 2.02¢ | 94% | 33% | no (capped) |
| Freight Quote Comparator | Logistics | 50 | 6 | 0.21¢ | 2.02¢ | 93% | 33% | no (capped) |
| Geocoding & Address Normalization Agent | Data | 50 | 5 | 0.23¢ | 1.25¢ | 91% | 50% | yes |
| Git Commit Message Generator | Dev Tools | 50 | 5 | 0.19¢ | 1.25¢ | 92% | 50% | yes |
| Git Diff to Conventional Commit Message | Dev Tools | 50 | 5 | 0.27¢ | 1.58¢ | 89% | 37% | yes |
| Good-Faith Violation & Pattern Day Trader Guard | Finance | 50 | 6 | 0.42¢ | 2.04¢ | 86% | 32% | no (capped) |
| Handwriting-to-Task OCR Agent | Productivity | 50 | 5 | 0.36¢ | 1.25¢ | 86% | 50% | yes |
| Help Center Article Gap Finder | Customer Support | 50 | 6 | 0.36¢ | 2.02¢ | 88% | 33% | no (capped) |
| Image Background Removal Agent | Media | 50 | 5 | 0.19¢ | 1.25¢ | 92% | 50% | yes |
| Image Upscaling Agent | Media | 50 | 5 | 0.19¢ | 1.25¢ | 92% | 50% | yes |
| Interview Scorecard Generator | HR | 50 | 6 | 0.42¢ | 2.03¢ | 86% | 33% | no (capped) |
| Invoice Payment Terms Analyzer | Finance | 50 | 5 | 0.36¢ | 1.25¢ | 86% | 50% | yes |
| Invoice/Receipt OCR Agent | Data | 50 | 5 | 0.41¢ | 1.26¢ | 84% | 50% | yes |
| Job Description Bias & Clarity Auditor | HR | 50 | 5 | 0.45¢ | 1.42¢ | 82% | 43% | yes |
| Job Description Writer | HR | 50 | 6 | 0.19¢ | 2.02¢ | 94% | 33% | no (capped) |
| Language Detection Agent | NLP | 50 | 5 | 0.21¢ | 1.25¢ | 92% | 50% | yes |
| Lead Enrichment Agent | Sales | 50 | 5 | 0.23¢ | 1.25¢ | 91% | 50% | yes |
| Liquidity-Adjusted Position Exit Planner | Finance | 50 | 5 | 0.40¢ | 1.13¢ | 84% | 55% | yes |
| Live Chat Sentiment Monitor | Customer Support | 50 | 5 | 0.21¢ | 1.25¢ | 92% | 50% | yes |
| Log Anomaly Pattern Extractor | DevOps | 50 | 5 | 0.42¢ | 1.42¢ | 83% | 43% | yes |
| Meeting Notes Summarizer | Productivity | 50 | 5 | 0.39¢ | 1.26¢ | 85% | 50% | yes |
| Multi-Account Buying-Power Aggregator | Finance | 50 | 6 | 0.42¢ | 2.03¢ | 86% | 33% | no (capped) |
| Multi-Carrier Rate & Transit Time Comparator | Logistics | 50 | 6 | 0.42¢ | 2.03¢ | 86% | 33% | no (capped) |
| Named Entity Extraction Agent | NLP | 50 | 5 | 0.36¢ | 1.25¢ | 86% | 50% | yes |
| Neighborhood Data Summary Agent | Real Estate | 50 | 5 | 0.19¢ | 1.25¢ | 93% | 50% | yes |
| Offer Letter & Compensation Narrative Builder | HR | 50 | 6 | 0.42¢ | 2.03¢ | 86% | 32% | no (capped) |
| Offer Letter Generator | HR | 50 | 5 | 0.19¢ | 1.56¢ | 92% | 38% | yes |
| PII & Sensitive Field Detector | Data | 50 | 5 | 0.43¢ | 1.28¢ | 83% | 49% | yes |
| Password Strength Auditor | Security | 50 | 5 | 0.21¢ | 1.25¢ | 92% | 50% | yes |
| Phishing Email Detector | Security | 50 | 5 | 0.38¢ | 1.25¢ | 85% | 50% | yes |
| Portfolio Correlation Matrix Builder | Finance | 50 | 6 | 0.42¢ | 2.03¢ | 86% | 33% | no (capped) |
| Portfolio Drawdown & Recovery Tracker | Finance | 50 | 6 | 0.29¢ | 2.04¢ | 90% | 32% | no (capped) |
| Position Sizing by Volatility & Account Risk | Finance | 50 | 5 | 0.24¢ | 1.12¢ | 90% | 55% | yes |
| Price Benchmark Agent | Procurement | 50 | 5 | 0.41¢ | 1.26¢ | 84% | 50% | yes |
| Product Catalog Enrichment Agent | E-commerce | 50 | 6 | 0.23¢ | 2.02¢ | 92% | 33% | no (capped) |
| Product Description Writer | Writing | 50 | 5 | 0.19¢ | 1.40¢ | 92% | 44% | yes |
| Property Listing Description Generator | Real Estate | 50 | 6 | 0.19¢ | 2.02¢ | 94% | 33% | no (capped) |
| Purchase Order Validator | Procurement | 50 | 6 | 0.36¢ | 2.02¢ | 88% | 33% | no (capped) |
| Realized vs Unrealized P&L Attribution Engine | Finance | 50 | 6 | 0.32¢ | 2.04¢ | 89% | 32% | no (capped) |
| Recurring Buy Cost-Average Tracker | Finance | 50 | 6 | 0.29¢ | 2.03¢ | 90% | 33% | no (capped) |
| Rental Yield Calculator | Real Estate | 50 | 5 | 0.15¢ | 1.10¢ | 94% | 56% | yes |
| Resume Bullet Point Rewriter | Writing | 50 | 5 | 0.19¢ | 1.25¢ | 92% | 50% | yes |
| Resume Screening Agent | HR | 50 | 5 | 0.38¢ | 1.41¢ | 85% | 44% | yes |
| Return Reason Classifier | E-commerce | 50 | 5 | 0.19¢ | 1.25¢ | 92% | 50% | yes |
| Returns Reason Code & Disposition Router | Logistics | 50 | 5 | 0.27¢ | 1.57¢ | 89% | 37% | yes |
| Review Summarization Agent | E-commerce | 50 | 6 | 0.38¢ | 2.02¢ | 87% | 33% | no (capped) |
| Robinhood Fractional Share Rebalancer | Finance | 50 | 6 | 0.43¢ | 2.04¢ | 86% | 32% | no (capped) |
| Robinhood Gold Margin Interest Optimizer | Finance | 50 | 6 | 0.45¢ | 2.04¢ | 85% | 32% | no (capped) |
| Robinhood Instant Settlement & Unsettled Funds Tracker | Finance | 50 | 6 | 0.45¢ | 2.04¢ | 85% | 32% | no (capped) |
| Robinhood Options Assignment Probability Estimator | Finance | 50 | 6 | 0.42¢ | 2.03¢ | 86% | 33% | no (capped) |
| Robinhood Portfolio Snapshot Normalizer | Finance | 50 | 5 | 0.44¢ | 1.45¢ | 82% | 42% | yes |
| SQL Query Explainer & Anti-Pattern Detector | Data | 50 | 5 | 0.42¢ | 1.42¢ | 83% | 43% | yes |
| Schema Validation Agent | Data | 50 | 6 | 0.39¢ | 2.02¢ | 87% | 33% | no (capped) |
| Sector & Factor Exposure Mapper | Finance | 50 | 6 | 0.42¢ | 2.03¢ | 86% | 33% | no (capped) |
| Sentiment & Intent Classifier | NLP | 50 | 5 | 0.23¢ | 1.25¢ | 91% | 50% | yes |
| Shipment Exception Classifier & Router | Logistics | 50 | 5 | 0.29¢ | 1.42¢ | 88% | 43% | yes |
| Shipping Cost Estimator | E-commerce | 50 | 6 | 0.19¢ | 2.02¢ | 94% | 33% | no (capped) |
| Social Media Caption Writer | Marketing | 50 | 5 | 0.38¢ | 1.41¢ | 85% | 44% | yes |
| Stop-Loss / Take-Profit Ladder Generator | Finance | 50 | 5 | 0.38¢ | 1.13¢ | 85% | 55% | yes |
| Supplier Onboarding Checklist Generator | Procurement | 50 | 6 | 0.45¢ | 2.04¢ | 85% | 32% | no (capped) |
| Support Ticket Triage Agent | Customer Support | 50 | 5 | 0.23¢ | 1.25¢ | 91% | 50% | yes |
| Task Prioritization Agent | Productivity | 50 | 6 | 0.36¢ | 2.02¢ | 88% | 33% | no (capped) |
| Taxable Account vs Tax-Advantaged Placement Advisor | Finance | 50 | 6 | 0.40¢ | 2.04¢ | 87% | 32% | no (capped) |
| Terms of Service Summarizer | Legal | 50 | 5 | 0.38¢ | 1.25¢ | 85% | 50% | yes |
| Text Summarization Agent | NLP | 50 | 5 | 0.19¢ | 1.25¢ | 92% | 50% | yes |
| Thumbnail A/B Concept Generator | Media | 50 | 5 | 0.36¢ | 1.40¢ | 86% | 44% | yes |
| Translation Agent | NLP | 50 | 5 | 0.19¢ | 1.56¢ | 92% | 38% | yes |
| Travel Itinerary Builder | Logistics | 50 | 5 | 0.36¢ | 1.56¢ | 86% | 38% | yes |
| UTM & Campaign Naming Standardizer | Marketing | 50 | 5 | 0.25¢ | 1.89¢ | 90% | 25% | yes |
| Uptime & Incident Summary Agent | DevOps | 50 | 6 | 0.21¢ | 2.02¢ | 93% | 33% | no (capped) |
| Video Transcript Summarizer | Media | 50 | 5 | 0.36¢ | 1.25¢ | 86% | 50% | yes |
| Volatility Regime Detector | Finance | 50 | 6 | 0.26¢ | 2.03¢ | 91% | 33% | no (capped) |
| Web Scrape & Extract Agent | Data | 50 | 6 | 0.19¢ | 2.02¢ | 94% | 33% | no (capped) |
| API Key Leak Scanner | Security | 55 | 5 | 0.36¢ | 1.26¢ | 86% | 50% | yes |
| Coinbase Advanced Trade Order Intent Translator | Finance | 55 | 6 | 0.45¢ | 2.04¢ | 85% | 32% | no (capped) |
| Coinbase Portfolio Rebalancer with Fee Awareness | Finance | 55 | 6 | 0.45¢ | 2.04¢ | 85% | 32% | no (capped) |
| Customs Documentation Completeness Checker | Logistics | 55 | 5 | 0.44¢ | 1.58¢ | 82% | 37% | yes |
| Deal Risk Scorer | Sales | 55 | 5 | 0.38¢ | 1.26¢ | 85% | 50% | yes |
| Earnings Whisper & Implied Move Pricer | Finance | 55 | 6 | 0.27¢ | 2.04¢ | 91% | 32% | no (capped) |
| Email Sequence Framework Builder | Marketing | 55 | 5 | 0.38¢ | 1.58¢ | 85% | 37% | yes |
| Kubernetes Manifest Security & Best-Practice Scanner | DevOps | 55 | 5 | 0.42¢ | 1.27¢ | 83% | 49% | yes |
| Liquidity Window & Market-Impact Estimator | Finance | 55 | 6 | 0.47¢ | 2.04¢ | 85% | 32% | no (capped) |
| Multi-Account Performance Attribution Snapshot | Finance | 55 | 6 | 0.47¢ | 2.03¢ | 85% | 32% | no (capped) |
| Performance Review Draft Assistant | HR | 55 | 5 | 0.47¢ | 1.73¢ | 81% | 31% | yes |
| Press Release Drafting Agent | Writing | 55 | 5 | 0.19¢ | 1.40¢ | 92% | 44% | yes |
| Purchase Order Risk Flagging Agent | Procurement | 55 | 6 | 0.43¢ | 2.04¢ | 86% | 32% | no (capped) |
| Unit Test Generator from Function Signature | Dev Tools | 55 | 5 | 0.42¢ | 1.73¢ | 83% | 31% | yes |
| Wash-Sale Risk Scanner | Finance | 55 | 6 | 0.42¢ | 2.04¢ | 86% | 32% | no (capped) |
| Comparable Sales (Comps) Finder | Real Estate | 60 | 5 | 0.36¢ | 1.26¢ | 86% | 50% | yes |
| Crypto Funding-Rate Arbitrage Monitor | Finance | 60 | 6 | 0.40¢ | 2.04¢ | 87% | 32% | no (capped) |
| Data Deduplication Agent | Data | 60 | 6 | 0.38¢ | 2.02¢ | 87% | 33% | no (capped) |
| Dependency CVE Alert Agent | Security | 60 | 5 | 0.36¢ | 1.41¢ | 86% | 44% | yes |
| Landing Page Message Hierarchy Auditor | Marketing | 60 | 5 | 0.45¢ | 1.43¢ | 82% | 43% | yes |
| Meeting Prep Briefing Agent | Sales | 60 | 6 | 0.19¢ | 2.02¢ | 94% | 33% | no (capped) |
| SEO Content Scorer | Marketing | 60 | 6 | 0.23¢ | 2.02¢ | 92% | 33% | no (capped) |
| Shipment Route Optimizer | Logistics | 60 | 6 | 0.38¢ | 2.02¢ | 87% | 33% | no (capped) |
| Terraform Plan Risk Summarizer | DevOps | 60 | 5 | 0.44¢ | 1.42¢ | 82% | 43% | yes |
| Unit Test Generator | Dev Tools | 60 | 5 | 0.19¢ | 1.40¢ | 92% | 44% | yes |
| Unrealized Loss Harvesting Opportunity Scanner | Finance | 60 | 6 | 0.41¢ | 2.05¢ | 86% | 32% | no (capped) |
| Crypto Basis & Cash-and-Carry Monitor | Finance | 65 | 6 | 0.40¢ | 2.04¢ | 87% | 32% | no (capped) |
| Options Portfolio Greeks & Risk Flag | Finance | 65 | 6 | 0.45¢ | 2.04¢ | 85% | 32% | no (capped) |
| Vendor Quote Comparison Engine | Procurement | 65 | 6 | 0.45¢ | 2.04¢ | 85% | 32% | no (capped) |
| API Load Test Agent | Dev Tools | 70 | 6 | 0.23¢ | 1.26¢ | 92% | 58% | yes |
| Campaign Brief to Creative Concept Expander | Marketing | 70 | 6 | 0.38¢ | 1.43¢ | 87% | 53% | yes |
| Contract Renewal Alert & Negotiation Brief | Procurement | 70 | 6 | 0.45¢ | 1.73¢ | 85% | 42% | yes |
| Customer Churn Risk Scorer | Customer Support | 70 | 6 | 0.38¢ | 1.25¢ | 87% | 58% | yes |
| Customs Documentation Checker | Logistics | 70 | 6 | 0.36¢ | 2.02¢ | 88% | 33% | no (capped) |
| Log Anomaly Detector | DevOps | 70 | 6 | 0.36¢ | 1.25¢ | 88% | 58% | yes |
| Margin Call & Maintenance Excess Forecaster | Finance | 70 | 6 | 0.48¢ | 2.05¢ | 84% | 32% | no (capped) |
| Tax-Lot Optimized Sell Selector | Finance | 70 | 6 | 0.44¢ | 2.05¢ | 86% | 32% | no (capped) |
| Vendor Risk Scorer | Procurement | 70 | 6 | 0.21¢ | 1.41¢ | 93% | 53% | yes |
| Warehouse Slotting & Pick-Path Optimizer | Logistics | 70 | 6 | 0.42¢ | 2.03¢ | 86% | 32% | no (capped) |
| Competitive Messaging Gap Analyzer | Marketing | 75 | 7 | 0.45¢ | 2.04¢ | 87% | 42% | no (capped) |
| Multi-Leg Options Structure Builder | Finance | 75 | 7 | 0.41¢ | 1.44¢ | 88% | 59% | yes |
| Container Image Vulnerability Scanner | DevOps | 80 | 7 | 0.36¢ | 2.02¢ | 90% | 43% | no (capped) |
| Cross-Exchange Spot Arbitrage Scanner | Finance | 80 | 7 | 0.41¢ | 2.05¢ | 88% | 42% | no (capped) |
| RFP Response Outline & Win-Theme Generator | Procurement | 80 | 7 | 0.45¢ | 1.43¢ | 87% | 59% | yes |
| Accessibility (WCAG) Audit Agent | Compliance | 90 | 8 | 0.36¢ | 1.25¢ | 91% | 69% | yes |
| Cloud Cost Optimizer Agent | DevOps | 90 | 8 | 0.36¢ | 2.02¢ | 91% | 50% | no (capped) |
| Dependency Vulnerability Scanner | Dev Tools | 90 | 8 | 0.36¢ | 1.26¢ | 91% | 69% | yes |
| Industry Trend Digest Agent | Research | 90 | 8 | 0.36¢ | 1.25¢ | 91% | 69% | yes |
| Lease Clause Risk Flagger | Real Estate | 90 | 8 | 0.36¢ | 1.26¢ | 91% | 69% | yes |
| NDA Comparison Agent | Legal | 90 | 8 | 0.36¢ | 1.41¢ | 91% | 65% | yes |
| Sales Proposal Generator | Sales | 90 | 8 | 0.19¢ | 1.41¢ | 95% | 65% | yes |
| Anomaly Detection Agent | Finance | 100 | 9 | 0.36¢ | 2.02¢ | 92% | 55% | no (capped) |
| Trademark Infringement Scanner | Legal | 110 | 10 | 0.36¢ | 2.02¢ | 93% | 60% | no (capped) |
| Code Review Agent | Dev Tools | 120 | 10 | 0.37¢ | 1.42¢ | 93% | 72% | yes |
| GDPR Data Request Handler Agent | Compliance | 120 | 10 | 0.38¢ | 1.41¢ | 92% | 72% | yes |
| RFP Response Drafting Agent | Procurement | 120 | 10 | 0.19¢ | 1.41¢ | 96% | 72% | yes |
| Market Sizing Estimator | Research | 130 | 11 | 0.25¢ | 1.41¢ | 95% | 74% | yes |
| Privacy Policy Compliance Checker | Legal | 130 | 11 | 0.38¢ | 1.41¢ | 93% | 75% | yes |
| SOC2 Evidence Collector Agent | Compliance | 140 | 12 | 0.38¢ | 1.26¢ | 94% | 79% | yes |
| Regulation Lookup Agent | Compliance | 150 | 13 | 0.41¢ | 1.41¢ | 94% | 78% | yes |
| AML Transaction Screening Agent | Compliance | 160 | 14 | 0.38¢ | 1.41¢ | 95% | 80% | yes |
| Patent Prior-Art Search Agent | Research | 180 | 15 | 0.36¢ | 1.26¢ | 95% | 83% | yes |
| Competitor Scan Agent | Research | 200 | 17 | 0.36¢ | 1.41¢ | 96% | 83% | yes |
| Contract Clause Review Agent | Legal | 450 | 38 | 0.37¢ | 2.03¢ | 98% | 89% | no (capped) |
| Smart Contract Security Audit Agent | Security | 500 | 42 | 0.37¢ | 1.26¢ | 98% | 94% | yes |
