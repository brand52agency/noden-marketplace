import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
// Demo orders use a static placeholder output rather than calling the real
// (paid, network-dependent) LLM fulfiller in lib/fulfillment.ts — seed data
// should stay fast, free, and runnable offline.
function demoOutput(listingName: string): Record<string, unknown> {
  return { demo_result: `Sample output for "${listingName}" — not a real fulfillment.` };
}

const db = new PrismaClient();

function apiKey() {
  return `agx_${randomBytes(24).toString("hex")}`;
}

// Generates a fresh password per seed run instead of a fixed literal —
// upsert's `update: {}` means this only ever applies to a genuinely new
// account, but a fixed password checked into a public repo would still
// double as a real login on any database the seed is later pointed at
// (this bit a shared dev/prod database once already). Printed once at
// the end of main() so a local run is still usable.
function seedPassword() {
  return randomBytes(9).toString("base64url");
}

function randomHash() {
  return randomBytes(16).toString("hex");
}

function fakeInvoice() {
  return `lnbc1${randomBytes(24).toString("hex")}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

// One representative input per listing — enough for the mock fulfillers in
// lib/fulfillment.ts to produce realistic-looking output for demo orders.
const SAMPLE_INPUTS: Record<string, Record<string, unknown>> = {
  "Contract Clause Review Agent": {
    document_text: "This Master Services Agreement is entered into between...",
    clause_types: ["indemnification", "limitation_of_liability"],
  },
  "Code Review Agent": { diff: "- return a - b\n+ return b - a", language: "TypeScript" },
  "Price Benchmark Agent": { product_category: "Cloud Object Storage", quoted_price_usd: 480 },
  "Web Scrape & Extract Agent": {
    url: "https://example.com/products/42",
    target_schema: { name: "string", price: "number" },
  },
  "Invoice/Receipt OCR Agent": { image_url: "https://example.com/receipts/8841.png" },
  "Sentiment & Intent Classifier": { text: "This is unacceptable — I want a refund immediately." },
  "SEO Content Scorer": {
    draft: "Our new product helps teams ship faster with less overhead.",
    target_keywords: ["ship faster", "team productivity"],
  },
  "Image Background Removal Agent": { image_url: "https://example.com/products/sneaker.png" },
  "Audio Transcription Agent": { audio_url: "https://example.com/calls/0231.mp3" },
  "Translation Agent": { text: "Thanks for your order!", source_lang: "en", target_lang: "es" },
  "Smart Contract Security Audit Agent": {
    solidity_code: "contract Vault { function withdraw() public { msg.sender.call{value: bal}(''); } }",
  },
  "Domain & Trademark Availability Checker": { proposed_name: "Nimbusly", tlds: ["com", "io"] },
  "Lead Enrichment Agent": { company_name: "Acme Robotics" },
  "Email Tone Polish Agent": { draft: "hey can u send that over", target_tone: "professional" },
  "Meeting Notes Summarizer": {
    transcript: "Priya: let's finalize the API spec by Friday. Marcus: staging deploy is blocked on the cert renewal.",
  },
  "Regulation Lookup Agent": {
    business_practice: "Storing EU customer emails on a US-based server",
    regulation_set: "GDPR",
  },
  "Competitor Scan Agent": { company_name: "Nimbusly", space: "workflow automation" },
  "Data Deduplication Agent": {
    rows: [{ id: 1, email: "a@x.com" }, { id: 1, email: "a@x.com" }, { id: 2, email: "b@x.com" }],
    target_schema: { id: "number", email: "string" },
  },
  "FX & Currency Conversion Agent": { amount: 500, from_currency: "USD", to_currency: "EUR" },
  "Anomaly Detection Agent": { transactions: [104, 98, 112, 101, 4850, 96] },
};

const LISTINGS = [
  {
    name: "Contract Clause Review Agent",
    category: "Legal",
    description: "Flags risky liability/indemnification clauses in a vendor contract.",
    details:
      "Reads a full vendor or partner contract and surfaces the clauses most likely to cause trouble later — indemnification, liability caps, auto-renewal terms, and one-sided termination rights. Each flagged clause comes back with a plain-language risk rating and the reasoning behind it, so a legal or procurement agent can jump straight to redlining instead of reading the whole document line by line. Built as a fast first-pass review before a human signs off, not a replacement for counsel.",
    priceSats: 450,
    inputSchema: {
      type: "object",
      required: ["document_text", "clause_types"],
      properties: {
        document_text: { type: "string" },
        clause_types: { type: "array", items: { type: "string" } },
      },
    },
    outputSchema: {
      type: "object",
      required: ["flagged_clauses"],
      properties: {
        flagged_clauses: {
          type: "array",
          items: {
            type: "object",
            required: ["clause", "risk", "rationale"],
            properties: { clause: { type: "string" }, risk: { type: "string" }, rationale: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Code Review Agent",
    category: "Dev Tools",
    description: "Reviews a diff for bugs, security issues, and style violations.",
    details:
      "Runs an automated first-pass review on a code diff before it reaches a human — catching likely bugs, common security pitfalls (injection, unsafe deserialization, hardcoded secrets), and style violations against the stated language's conventions. Each issue is tied to a specific line with a severity and a short explanation, so a CI agent can block a risky merge or leave inline review comments automatically, cutting down on the repetitive review notes senior engineers end up writing by hand.",
    priceSats: 120,
    inputSchema: {
      type: "object",
      required: ["diff", "language"],
      properties: { diff: { type: "string" }, language: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["issues"],
      properties: {
        issues: {
          type: "array",
          items: {
            type: "object",
            required: ["line", "type", "severity", "note"],
            properties: {
              line: { type: "number" },
              type: { type: "string" },
              severity: { type: "string" },
              note: { type: "string" },
            },
          },
        },
      },
    },
  },
  {
    name: "Price Benchmark Agent",
    category: "Procurement",
    description: "Compares a quoted price against current market rates for a category.",
    details:
      "Checks whether a quoted price is in line with the current market for that product category, using recent comparable pricing data. Returns a benchmark range plus a clear buy/negotiate/reject recommendation with the reasoning behind it, so a purchasing agent can push back on an inflated quote automatically instead of escalating every negotiation to a human.",
    priceSats: 30,
    inputSchema: {
      type: "object",
      required: ["product_category", "quoted_price_usd"],
      properties: { product_category: { type: "string" }, quoted_price_usd: { type: "number" } },
    },
    outputSchema: {
      type: "object",
      required: ["benchmark_range_usd", "recommendation", "rationale"],
      properties: {
        benchmark_range_usd: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
        recommendation: { type: "string" },
        rationale: { type: "string" },
      },
    },
  },
  {
    name: "Web Scrape & Extract Agent",
    category: "Data",
    description: "Pulls structured fields from a given URL against a target schema.",
    details:
      "Given any URL and a target schema, pulls exactly the fields you asked for — prices, specs, contact details, article metadata, whatever the schema defines — as clean structured data instead of raw HTML you'd have to parse yourself. Ideal for agents that need to keep a dataset current by pulling from live web sources on a recurring basis.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["url", "target_schema"],
      properties: { url: { type: "string" }, target_schema: { type: "object" } },
    },
    outputSchema: { type: "object", required: ["extracted"], properties: { extracted: { type: "object" } } },
  },
  {
    name: "Invoice/Receipt OCR Agent",
    category: "Data",
    description: "Extracts line items, totals, and vendor info from a document image.",
    details:
      "Reads a photo or scan of an invoice or receipt and returns the vendor name, total, and an itemized line-item breakdown as structured data — no manual data entry required. Built for bookkeeping and expense-management agents that need to turn a pile of receipt images into clean, reconcilable records.",
    priceSats: 40,
    inputSchema: { type: "object", required: ["image_url"], properties: { image_url: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["vendor", "total", "line_items"],
      properties: {
        vendor: { type: "string" },
        total: { type: "number" },
        line_items: {
          type: "array",
          items: {
            type: "object",
            required: ["description", "amount"],
            properties: { description: { type: "string" }, amount: { type: "number" } },
          },
        },
      },
    },
  },
  {
    name: "Sentiment & Intent Classifier",
    category: "NLP",
    description: "Scores text for sentiment, urgency, and intent category.",
    details:
      "Scores any piece of text for sentiment (positive/negative/neutral), urgency, and the underlying intent behind it. Useful for triaging support tickets, prioritizing inbound messages, or routing a conversation to the right downstream workflow before a human ever has to read it.",
    priceSats: 15,
    inputSchema: { type: "object", required: ["text"], properties: { text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["sentiment", "urgency", "intent"],
      properties: { sentiment: { type: "string" }, urgency: { type: "string" }, intent: { type: "string" } },
    },
  },
  {
    name: "SEO Content Scorer",
    category: "Marketing",
    description: "Scores a draft against target keywords and readability.",
    details:
      "Scores a content draft against a target keyword list and standard readability metrics, returning a numeric score plus a keyword-coverage breakdown. Helps a content-generation agent know whether a draft is ready to publish or needs another editing pass before it goes live.",
    priceSats: 60,
    inputSchema: {
      type: "object",
      required: ["draft", "target_keywords"],
      properties: { draft: { type: "string" }, target_keywords: { type: "array", items: { type: "string" } } },
    },
    outputSchema: {
      type: "object",
      required: ["score", "readability", "keyword_coverage"],
      properties: { score: { type: "number" }, readability: { type: "string" }, keyword_coverage: { type: "object" } },
    },
  },
  {
    name: "Image Background Removal Agent",
    category: "Media",
    description: "Removes/replaces background on a product image.",
    details:
      "Strips or replaces the background on a product photo, returning a clean cutout ready to drop into a listing, ad creative, or catalog — no manual masking in an image editor required. Popular with e-commerce and marketing agents that need consistent, professional product imagery at volume.",
    priceSats: 20,
    inputSchema: { type: "object", required: ["image_url"], properties: { image_url: { type: "string" } } },
    outputSchema: { type: "object", required: ["result_url"], properties: { result_url: { type: "string" } } },
  },
  {
    name: "Audio Transcription Agent",
    category: "Media",
    description: "Converts audio to timestamped text.",
    details:
      "Converts spoken audio into a full text transcript with word/segment-level timestamps, so downstream agents can search, subtitle, or index recorded calls, meetings, and podcasts without listening to the raw audio.",
    priceSats: 35,
    inputSchema: { type: "object", required: ["audio_url"], properties: { audio_url: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["transcript", "segments"],
      properties: {
        transcript: { type: "string" },
        segments: {
          type: "array",
          items: {
            type: "object",
            required: ["start", "end", "text"],
            properties: { start: { type: "number" }, end: { type: "number" }, text: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Translation Agent",
    category: "NLP",
    description: "Translates structured content between language pairs, preserving formatting.",
    details:
      "Translates text between language pairs while preserving structure and formatting — not just a raw pass through a translation API, but output that stays usable in whatever document or UI it came from. Useful for any agent localizing content, support replies, or product copy on the fly.",
    priceSats: 30,
    inputSchema: {
      type: "object",
      required: ["text", "source_lang", "target_lang"],
      properties: { text: { type: "string" }, source_lang: { type: "string" }, target_lang: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["translated_text"], properties: { translated_text: { type: "string" } } },
  },
  {
    name: "Smart Contract Security Audit Agent",
    category: "Security",
    description: "Scans Solidity code for reentrancy, overflow, and access-control issues.",
    details:
      "Scans Solidity source for the vulnerability classes that actually cause exploits — reentrancy, integer overflow/underflow, and missing or broken access controls — and returns each finding with a severity, category, and the exact line it lives on. A fast, affordable first pass before a full manual audit, not a replacement for one.",
    priceSats: 500,
    inputSchema: { type: "object", required: ["solidity_code"], properties: { solidity_code: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["findings"],
      properties: {
        findings: {
          type: "array",
          items: {
            type: "object",
            required: ["severity", "category", "line", "description"],
            properties: {
              severity: { type: "string" },
              category: { type: "string" },
              line: { type: "number" },
              description: { type: "string" },
            },
          },
        },
      },
    },
  },
  {
    name: "Domain & Trademark Availability Checker",
    category: "Research",
    description: "Checks live domain availability plus a basic trademark collision scan for a proposed name.",
    details:
      "Checks whether a proposed name is available as a domain across the TLDs you specify, and runs a basic trademark collision scan to flag names likely to run into legal trouble. Built for agents helping someone name a company, product, or project who need a fast go/no-go before they get attached to a name.",
    priceSats: 50,
    inputSchema: {
      type: "object",
      required: ["proposed_name", "tlds"],
      properties: { proposed_name: { type: "string" }, tlds: { type: "array", items: { type: "string" } } },
    },
    outputSchema: {
      type: "object",
      required: ["domain_availability", "trademark_risk"],
      properties: { domain_availability: { type: "object" }, trademark_risk: { type: "string" } },
    },
  },
  {
    name: "Lead Enrichment Agent",
    category: "Sales",
    description: "Returns firmographic data (size, industry, funding) for a company name.",
    details:
      "Takes a company name and returns firmographic data — industry, employee count range, and funding stage — so a sales or outreach agent can qualify and prioritize leads automatically instead of manually researching each one.",
    priceSats: 45,
    inputSchema: { type: "object", required: ["company_name"], properties: { company_name: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["industry", "employee_count_range", "funding_stage"],
      properties: {
        industry: { type: "string" },
        employee_count_range: { type: "string" },
        funding_stage: { type: "string" },
      },
    },
  },
  {
    name: "Email Tone Polish Agent",
    category: "Writing",
    description: "Rewrites a draft email to a specified tone while preserving intent.",
    details:
      "Rewrites a draft email in a specified tone — more formal, warmer, more concise, whatever's needed — while preserving the original intent and key details. Useful for any agent drafting outbound communication that needs to match a specific voice before it's sent.",
    priceSats: 20,
    inputSchema: {
      type: "object",
      required: ["draft", "target_tone"],
      properties: { draft: { type: "string" }, target_tone: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["revised_text"], properties: { revised_text: { type: "string" } } },
  },
  {
    name: "Meeting Notes Summarizer",
    category: "Productivity",
    description: "Converts a transcript into structured action items and owners.",
    details:
      "Turns a raw meeting transcript into a structured summary plus a clear list of action items, each with an owner and a due date. Saves an agent — or the human it works for — from re-reading a full transcript just to figure out who owes what.",
    priceSats: 35,
    inputSchema: { type: "object", required: ["transcript"], properties: { transcript: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["summary", "action_items"],
      properties: {
        summary: { type: "string" },
        action_items: {
          type: "array",
          items: {
            type: "object",
            required: ["owner", "task", "due"],
            properties: { owner: { type: "string" }, task: { type: "string" }, due: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Regulation Lookup Agent",
    category: "Compliance",
    description: "Checks a stated business practice against a specified regulation set.",
    details:
      "Checks a described business practice against a specified set of regulations and returns a compliant/non-compliant call with citations and supporting notes. Gives a compliance-monitoring agent a fast, defensible first opinion before escalating to legal.",
    priceSats: 150,
    inputSchema: {
      type: "object",
      required: ["business_practice", "regulation_set"],
      properties: { business_practice: { type: "string" }, regulation_set: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["compliant", "citations", "notes"],
      properties: {
        compliant: { type: "boolean" },
        citations: { type: "array", items: { type: "string" } },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "Competitor Scan Agent",
    category: "Research",
    description: "Given a company and space, returns a structured competitor summary.",
    details:
      "Given a company and its market space, returns a structured breakdown of its key competitors — including how each one positions itself and where its strengths lie. Useful for a research or strategy agent building a competitive landscape without manually digging through websites and press coverage.",
    priceSats: 200,
    inputSchema: {
      type: "object",
      required: ["company_name", "space"],
      properties: { company_name: { type: "string" }, space: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["competitors"],
      properties: {
        competitors: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "positioning", "strength"],
            properties: { name: { type: "string" }, positioning: { type: "string" }, strength: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Data Deduplication Agent",
    category: "Data",
    description: "Cleans and deduplicates a messy CSV/dataset against a target schema.",
    details:
      "Cleans a messy dataset or CSV against a target schema, removing duplicate records and returning both the deduplicated rows and a count of what was removed. Built for agents maintaining a canonical dataset that's fed by multiple, overlapping sources.",
    priceSats: 60,
    inputSchema: {
      type: "object",
      required: ["rows", "target_schema"],
      properties: { rows: { type: "array" }, target_schema: { type: "object" } },
    },
    outputSchema: {
      type: "object",
      required: ["deduplicated_rows", "duplicates_removed"],
      properties: { deduplicated_rows: { type: "array" }, duplicates_removed: { type: "number" } },
    },
  },
  {
    name: "FX & Currency Conversion Agent",
    category: "Finance",
    description: "Real-time exchange rate lookup and conversion between currency pairs.",
    details:
      "Looks up a live exchange rate and converts an amount between two currencies, returning both the converted amount and the rate used. A cheap, fast utility call for any agent that needs to normalize prices or transactions across currencies.",
    priceSats: 10,
    inputSchema: {
      type: "object",
      required: ["amount", "from_currency", "to_currency"],
      properties: { amount: { type: "number" }, from_currency: { type: "string" }, to_currency: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["converted_amount", "rate"],
      properties: { converted_amount: { type: "number" }, rate: { type: "number" } },
    },
  },
  {
    name: "Anomaly Detection Agent",
    category: "Finance",
    description: "Flags statistically anomalous transactions in a supplied dataset.",
    details:
      "Scans a set of transactions and flags the ones that are statistically anomalous relative to the rest, along with a reason for each flag. Useful for a fraud-monitoring or reconciliation agent that needs a fast first pass before a human reviews the flagged items.",
    priceSats: 100,
    inputSchema: { type: "object", required: ["transactions"], properties: { transactions: { type: "array" } } },
    outputSchema: {
      type: "object",
      required: ["anomalies"],
      properties: {
        anomalies: {
          type: "array",
          items: {
            type: "object",
            required: ["index", "reason"],
            properties: { index: { type: "number" }, reason: { type: "string" } },
          },
        },
      },
    },
  },

  // ---- Legal ----
  {
    name: "NDA Comparison Agent",
    category: "Legal",
    description: "Compares a counterparty's NDA draft against your standard terms and flags deviations.",
    details:
      "Compares a draft NDA line-by-line against your organization's standard NDA terms, flagging every clause that deviates — shortened survival periods, missing mutuality, unusual carve-outs — with the standard-term comparison alongside each one. A fast first-pass triage so legal can redline only what's actually different instead of the whole document.",
    priceSats: 90,
    inputSchema: {
      type: "object",
      required: ["document_text", "standard_terms"],
      properties: { document_text: { type: "string" }, standard_terms: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["deviations"],
      properties: {
        deviations: {
          type: "array",
          items: {
            type: "object",
            required: ["clause", "deviation_note"],
            properties: { clause: { type: "string" }, deviation_note: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Terms of Service Summarizer",
    category: "Legal",
    description: "Turns a long ToS or EULA into a plain-language summary of what users are agreeing to.",
    details:
      "Reads a full Terms of Service or EULA and returns a plain-language summary of the obligations, data rights, and restrictions a user is actually agreeing to. Useful for a compliance or procurement agent that needs to quickly understand a vendor's terms without reading pages of legalese.",
    priceSats: 40,
    inputSchema: { type: "object", required: ["document_text"], properties: { document_text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["summary", "key_obligations"],
      properties: { summary: { type: "string" }, key_obligations: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Privacy Policy Compliance Checker",
    category: "Legal",
    description: "Checks a privacy policy for the disclosures required under a named regulation.",
    details:
      "Checks a company's privacy policy text against the disclosure requirements of a named regulation (GDPR, CCPA, etc.) and returns which required disclosures are present, which are missing, and supporting notes. Gives a compliance agent a fast first opinion before legal does a full review.",
    priceSats: 130,
    inputSchema: {
      type: "object",
      required: ["policy_text", "regulation"],
      properties: { policy_text: { type: "string" }, regulation: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["missing_disclosures", "notes"],
      properties: { missing_disclosures: { type: "array", items: { type: "string" } }, notes: { type: "string" } },
    },
  },
  {
    name: "Trademark Infringement Scanner",
    category: "Legal",
    description: "Scans a list of marketplace or web listings for possible trademark infringement on a mark.",
    details:
      "Given a registered trademark and a list of listing titles or URLs, flags the ones that look like potential infringement — knockoffs, counterfeit language, unauthorized use of a brand name — with a confidence score for each. Built for a brand-protection agent monitoring marketplaces at scale.",
    priceSats: 110,
    inputSchema: {
      type: "object",
      required: ["trademark", "listings"],
      properties: { trademark: { type: "string" }, listings: { type: "array", items: { type: "string" } } },
    },
    outputSchema: {
      type: "object",
      required: ["flagged"],
      properties: {
        flagged: {
          type: "array",
          items: {
            type: "object",
            required: ["listing", "confidence"],
            properties: { listing: { type: "string" }, confidence: { type: "number" } },
          },
        },
      },
    },
  },

  // ---- Dev Tools ----
  {
    name: "API Load Test Agent",
    category: "Dev Tools",
    description: "Runs a synthetic load test against an API endpoint and reports latency/error stats.",
    details:
      "Fires a configurable burst of synthetic requests at an API endpoint and returns latency percentiles, error rate, and throughput. Lets a deployment agent verify an endpoint holds up under load before promoting a release, without standing up a separate load-testing pipeline.",
    priceSats: 70,
    inputSchema: {
      type: "object",
      required: ["url", "requests", "concurrency"],
      properties: { url: { type: "string" }, requests: { type: "number" }, concurrency: { type: "number" } },
    },
    outputSchema: {
      type: "object",
      required: ["p50_ms", "p99_ms", "error_rate"],
      properties: { p50_ms: { type: "number" }, p99_ms: { type: "number" }, error_rate: { type: "number" } },
    },
  },
  {
    name: "Dependency Vulnerability Scanner",
    category: "Dev Tools",
    description: "Scans a dependency manifest for packages with known CVEs.",
    details:
      "Reads a package manifest (package.json, requirements.txt, etc.) and cross-references every dependency against known CVEs, returning each vulnerable package with its severity and fixed version. A quick supply-chain check to run before every deploy, not just at audit time.",
    priceSats: 90,
    inputSchema: { type: "object", required: ["manifest_text"], properties: { manifest_text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["vulnerabilities"],
      properties: {
        vulnerabilities: {
          type: "array",
          items: {
            type: "object",
            required: ["package", "severity", "fixed_version"],
            properties: { package: { type: "string" }, severity: { type: "string" }, fixed_version: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Git Commit Message Generator",
    category: "Dev Tools",
    description: "Writes a conventional-commit message from a diff.",
    details:
      "Reads a code diff and writes a properly formatted conventional-commit message — type, scope, and a concise summary — so an automation agent committing on a human's behalf doesn't leave a trail of \"fix stuff\" commits.",
    priceSats: 15,
    inputSchema: { type: "object", required: ["diff"], properties: { diff: { type: "string" } } },
    outputSchema: { type: "object", required: ["commit_message"], properties: { commit_message: { type: "string" } } },
  },
  {
    name: "Unit Test Generator",
    category: "Dev Tools",
    description: "Generates unit tests for a given function against its stated behavior.",
    details:
      "Given a function's source and a plain-language description of its intended behavior, generates a set of unit tests covering the normal case and the obvious edge cases. Meant as a starting point a developer or CI agent can extend, not a substitute for real test design.",
    priceSats: 60,
    inputSchema: {
      type: "object",
      required: ["function_source", "language"],
      properties: { function_source: { type: "string" }, language: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["test_code"], properties: { test_code: { type: "string" } } },
  },

  // ---- Procurement ----
  {
    name: "Vendor Risk Scorer",
    category: "Procurement",
    description: "Scores a vendor's financial and operational risk from public signals.",
    details:
      "Given a vendor name and category, returns a risk score based on public financial and operational signals — years in business, industry volatility, concentration risk — with a short rationale. Helps a procurement agent flag a risky new vendor before a contract is signed.",
    priceSats: 70,
    inputSchema: {
      type: "object",
      required: ["vendor_name", "category"],
      properties: { vendor_name: { type: "string" }, category: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["risk_score", "rationale"],
      properties: { risk_score: { type: "number" }, rationale: { type: "string" } },
    },
  },
  {
    name: "RFP Response Drafting Agent",
    category: "Procurement",
    description: "Drafts a first-pass RFP response from your capability sheet and the RFP requirements.",
    details:
      "Takes an incoming RFP's stated requirements and your company's capability sheet, and drafts a first-pass point-by-point response mapping each requirement to how you meet it. Cuts the blank-page time out of RFP season — a proposal team still edits and finalizes it.",
    priceSats: 120,
    inputSchema: {
      type: "object",
      required: ["rfp_requirements", "capability_sheet"],
      properties: { rfp_requirements: { type: "string" }, capability_sheet: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["draft_response"], properties: { draft_response: { type: "string" } } },
  },
  {
    name: "Purchase Order Validator",
    category: "Procurement",
    description: "Checks a purchase order against the original quote for price and quantity mismatches.",
    details:
      "Compares a purchase order's line items against the original vendor quote and flags any mismatch in price, quantity, or terms before the PO is approved. A cheap automatic check that catches the kind of data-entry error that otherwise slips through to an invoice dispute.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["purchase_order", "quote"],
      properties: { purchase_order: { type: "object" }, quote: { type: "object" } },
    },
    outputSchema: {
      type: "object",
      required: ["mismatches"],
      properties: { mismatches: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Contract Renewal Tracker",
    category: "Procurement",
    description: "Reads a contract for its renewal/termination terms and returns key dates.",
    details:
      "Reads a vendor contract and extracts the renewal date, auto-renewal terms, and the notice period required to cancel — the three dates procurement teams most often miss. Feeds directly into a reminder or audit-log agent so a contract never silently auto-renews.",
    priceSats: 35,
    inputSchema: { type: "object", required: ["contract_text"], properties: { contract_text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["renewal_date", "notice_period_days", "auto_renews"],
      properties: {
        renewal_date: { type: "string" },
        notice_period_days: { type: "number" },
        auto_renews: { type: "boolean" },
      },
    },
  },

  // ---- Data ----
  {
    name: "Schema Validation Agent",
    category: "Data",
    description: "Validates a batch of records against a JSON Schema and returns every violation.",
    details:
      "Validates a batch of records against a supplied JSON Schema and returns exactly which records fail and why. Useful for any agent ingesting data from an external source that needs to reject or quarantine malformed records before they hit a production dataset.",
    priceSats: 20,
    inputSchema: {
      type: "object",
      required: ["records", "schema"],
      properties: { records: { type: "array" }, schema: { type: "object" } },
    },
    outputSchema: {
      type: "object",
      required: ["valid_count", "violations"],
      properties: {
        valid_count: { type: "number" },
        violations: {
          type: "array",
          items: {
            type: "object",
            required: ["index", "error"],
            properties: { index: { type: "number" }, error: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Geocoding & Address Normalization Agent",
    category: "Data",
    description: "Normalizes a messy address string and returns latitude/longitude plus a clean format.",
    details:
      "Takes a free-text, possibly messy address and returns a normalized address string plus latitude/longitude coordinates. A cheap utility call for any agent that needs to clean up user-entered addresses before storing or mapping them.",
    priceSats: 15,
    inputSchema: { type: "object", required: ["address"], properties: { address: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["normalized_address", "lat", "lng"],
      properties: { normalized_address: { type: "string" }, lat: { type: "number" }, lng: { type: "number" } },
    },
  },

  // ---- NLP ----
  {
    name: "Text Summarization Agent",
    category: "NLP",
    description: "Summarizes a long document into a target word count.",
    details:
      "Condenses a long piece of text down to a target length while preserving the key points — no fixed template, just a tight, faithful summary. Useful for any agent that needs to pass a shorter version of a document downstream without losing the substance.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["text", "target_words"],
      properties: { text: { type: "string" }, target_words: { type: "number" } },
    },
    outputSchema: { type: "object", required: ["summary"], properties: { summary: { type: "string" } } },
  },
  {
    name: "Named Entity Extraction Agent",
    category: "NLP",
    description: "Extracts people, organizations, locations, and dates from a block of text.",
    details:
      "Pulls every named person, organization, location, and date out of a block of text and returns them tagged by type. Useful for an agent that needs to build a structured index of unstructured documents — contracts, articles, transcripts — at scale.",
    priceSats: 20,
    inputSchema: { type: "object", required: ["text"], properties: { text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["entities"],
      properties: {
        entities: {
          type: "array",
          items: {
            type: "object",
            required: ["text", "type"],
            properties: { text: { type: "string" }, type: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Language Detection Agent",
    category: "NLP",
    description: "Detects the language of a piece of text with a confidence score.",
    details:
      "Detects which language a piece of text is written in and returns a confidence score. A cheap, fast routing step for any agent that needs to decide whether translation is needed before doing anything else with the text.",
    priceSats: 10,
    inputSchema: { type: "object", required: ["text"], properties: { text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["language", "confidence"],
      properties: { language: { type: "string" }, confidence: { type: "number" } },
    },
  },

  // ---- Marketing ----
  {
    name: "Ad Copy Generator",
    category: "Marketing",
    description: "Generates a set of ad headline/body variants for a product and channel.",
    details:
      "Generates a set of ad headline and body copy variants for a given product and channel (search, social, display), tuned to that channel's length limits and tone conventions. Gives a marketing agent a starting set to A/B test instead of writing every variant by hand.",
    priceSats: 35,
    inputSchema: {
      type: "object",
      required: ["product_description", "channel"],
      properties: { product_description: { type: "string" }, channel: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["variants"],
      properties: {
        variants: {
          type: "array",
          items: {
            type: "object",
            required: ["headline", "body"],
            properties: { headline: { type: "string" }, body: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Social Media Caption Writer",
    category: "Marketing",
    description: "Writes a platform-tuned caption with hashtags for a post description.",
    details:
      "Writes a caption tuned to a specific platform's voice and length conventions (Instagram, LinkedIn, X) from a plain description of the post, plus a relevant hashtag set. Keeps a content-scheduling agent from posting the same generic caption everywhere.",
    priceSats: 20,
    inputSchema: {
      type: "object",
      required: ["post_description", "platform"],
      properties: { post_description: { type: "string" }, platform: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["caption", "hashtags"],
      properties: { caption: { type: "string" }, hashtags: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Email Subject Line Optimizer",
    category: "Marketing",
    description: "Scores and rewrites an email subject line for open-rate potential.",
    details:
      "Scores a draft email subject line for open-rate potential and returns rewritten alternatives tuned for clarity and urgency without tipping into spam-trigger language. A quick sanity check before a campaign agent sends to a full list.",
    priceSats: 20,
    inputSchema: { type: "object", required: ["subject_line"], properties: { subject_line: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["score", "alternatives"],
      properties: { score: { type: "number" }, alternatives: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Brand Voice Consistency Checker",
    category: "Marketing",
    description: "Checks a piece of copy against a brand voice guide and flags inconsistencies.",
    details:
      "Checks a piece of marketing copy against a written brand voice guide and flags spots where the tone, vocabulary, or style drifts from it. Keeps a content-generation agent's output on-brand without a human reading every single piece before it ships.",
    priceSats: 45,
    inputSchema: {
      type: "object",
      required: ["copy_text", "brand_voice_guide"],
      properties: { copy_text: { type: "string" }, brand_voice_guide: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["consistent", "issues"],
      properties: { consistent: { type: "boolean" }, issues: { type: "array", items: { type: "string" } } },
    },
  },

  // ---- Media ----
  {
    name: "Video Transcript Summarizer",
    category: "Media",
    description: "Turns a video transcript into chaptered highlights.",
    details:
      "Takes a raw video transcript and breaks it into chaptered highlights with timestamps, so a viewer — or a downstream indexing agent — can jump straight to the relevant part instead of watching the whole thing.",
    priceSats: 45,
    inputSchema: { type: "object", required: ["transcript"], properties: { transcript: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["chapters"],
      properties: {
        chapters: {
          type: "array",
          items: {
            type: "object",
            required: ["timestamp", "title"],
            properties: { timestamp: { type: "string" }, title: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Image Upscaling Agent",
    category: "Media",
    description: "Upscales a low-resolution image to a target resolution.",
    details:
      "Upscales a low-resolution product or asset image to a target resolution without the blur and artifacts of a naive resize. Useful for an e-commerce or media agent stuck with source images too small for a modern layout.",
    priceSats: 30,
    inputSchema: {
      type: "object",
      required: ["image_url", "target_width"],
      properties: { image_url: { type: "string" }, target_width: { type: "number" } },
    },
    outputSchema: { type: "object", required: ["result_url"], properties: { result_url: { type: "string" } } },
  },
  {
    name: "Thumbnail A/B Concept Generator",
    category: "Media",
    description: "Generates several distinct thumbnail concepts for a piece of video content.",
    details:
      "Given a video's title and topic, generates several distinct thumbnail concepts — composition, text overlay, focal point — ready to hand to a designer or image-generation agent, so a content team isn't starting from a blank canvas for every upload.",
    priceSats: 40,
    inputSchema: {
      type: "object",
      required: ["title", "topic"],
      properties: { title: { type: "string" }, topic: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["concepts"],
      properties: { concepts: { type: "array", items: { type: "string" } } },
    },
  },

  // ---- Security ----
  {
    name: "Phishing Email Detector",
    category: "Security",
    description: "Classifies whether an email is likely phishing, with the signals that triggered it.",
    details:
      "Classifies a raw email (headers, body, links) as likely phishing or legitimate, returning the specific signals that drove the call — spoofed sender domain, urgency language, mismatched link text. A fast first-line filter before it ever reaches an inbox.",
    priceSats: 20,
    inputSchema: { type: "object", required: ["email_raw"], properties: { email_raw: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["is_phishing", "signals"],
      properties: { is_phishing: { type: "boolean" }, signals: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Password Strength Auditor",
    category: "Security",
    description: "Scores a password's strength and estimates crack time, without ever storing it.",
    details:
      "Scores a password's strength against common cracking patterns (dictionary words, keyboard walks, reused structures) and returns an estimated crack time — evaluated in-memory, never logged or stored. A cheap check for any onboarding agent enforcing a real password policy.",
    priceSats: 12,
    inputSchema: { type: "object", required: ["password"], properties: { password: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["score", "estimated_crack_time"],
      properties: { score: { type: "number" }, estimated_crack_time: { type: "string" } },
    },
  },
  {
    name: "Dependency CVE Alert Agent",
    category: "Security",
    description: "Checks a single package name and version against known CVEs.",
    details:
      "Checks one package name and version against known CVE databases and returns any matching vulnerabilities with severity. The single-package sibling of the full manifest scanner — built for a CI agent doing a fast check on just the dependency it's about to bump.",
    priceSats: 60,
    inputSchema: {
      type: "object",
      required: ["package_name", "version"],
      properties: { package_name: { type: "string" }, version: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["cves"],
      properties: {
        cves: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "severity"],
            properties: { id: { type: "string" }, severity: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "API Key Leak Scanner",
    category: "Security",
    description: "Scans a code repository or diff for accidentally committed secrets.",
    details:
      "Scans a code diff or full repository text for accidentally committed API keys, tokens, and credentials, matching known key-format patterns from major providers. Meant to run on every commit an automation agent makes, catching a leak before it ever reaches a public remote.",
    priceSats: 55,
    inputSchema: { type: "object", required: ["repository_text"], properties: { repository_text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["leaks_found"],
      properties: {
        leaks_found: {
          type: "array",
          items: {
            type: "object",
            required: ["file", "type"],
            properties: { file: { type: "string" }, type: { type: "string" } },
          },
        },
      },
    },
  },

  // ---- Research ----
  {
    name: "Market Sizing Estimator",
    category: "Research",
    description: "Estimates TAM/SAM/SOM for a described product and target market.",
    details:
      "Given a product description and target market, estimates the total addressable, serviceable, and obtainable market size with the reasoning and sources behind each number. Gives a strategy agent a defensible first-pass sizing before commissioning real market research.",
    priceSats: 130,
    inputSchema: {
      type: "object",
      required: ["product_description", "target_market"],
      properties: { product_description: { type: "string" }, target_market: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["tam_usd", "sam_usd", "som_usd", "rationale"],
      properties: {
        tam_usd: { type: "number" },
        sam_usd: { type: "number" },
        som_usd: { type: "number" },
        rationale: { type: "string" },
      },
    },
  },
  {
    name: "Patent Prior-Art Search Agent",
    category: "Research",
    description: "Searches for prior art that could affect the novelty of a described invention.",
    details:
      "Given a plain-language description of an invention, searches for existing patents and publications that could count as prior art, returning each match with its relevance. A fast, affordable first pass before commissioning a formal patentability opinion — not a substitute for one.",
    priceSats: 180,
    inputSchema: {
      type: "object",
      required: ["invention_description"],
      properties: { invention_description: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["prior_art"],
      properties: {
        prior_art: {
          type: "array",
          items: {
            type: "object",
            required: ["reference", "relevance"],
            properties: { reference: { type: "string" }, relevance: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Industry Trend Digest Agent",
    category: "Research",
    description: "Summarizes the current major trends in a named industry.",
    details:
      "Given an industry name, returns a structured digest of the major trends currently shaping it — what's driving growth, what's disrupting incumbents, what's cooling off. Useful for a strategy or content agent that needs a quick, current-state briefing before deeper work.",
    priceSats: 90,
    inputSchema: { type: "object", required: ["industry"], properties: { industry: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["trends"],
      properties: {
        trends: {
          type: "array",
          items: {
            type: "object",
            required: ["trend", "impact"],
            properties: { trend: { type: "string" }, impact: { type: "string" } },
          },
        },
      },
    },
  },

  // ---- Sales ----
  {
    name: "Sales Proposal Generator",
    category: "Sales",
    description: "Drafts a sales proposal from a discovery-call summary and your pricing sheet.",
    details:
      "Turns a discovery-call summary and your standard pricing sheet into a first-draft sales proposal — tailored to the prospect's stated needs, with pricing already filled in. Lets a sales agent get a proposal in front of a prospect same-day instead of waiting on a rep's calendar.",
    priceSats: 90,
    inputSchema: {
      type: "object",
      required: ["discovery_notes", "pricing_sheet"],
      properties: { discovery_notes: { type: "string" }, pricing_sheet: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["proposal_text"], properties: { proposal_text: { type: "string" } } },
  },
  {
    name: "Cold Email Personalizer",
    category: "Sales",
    description: "Personalizes a cold email template using facts about the recipient's company.",
    details:
      "Takes a cold email template and a few facts about the recipient's company, and weaves them in naturally so the email reads as researched, not templated. Built for an outbound agent sending at volume without sounding like it.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["template", "company_facts"],
      properties: { template: { type: "string" }, company_facts: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["personalized_email"], properties: { personalized_email: { type: "string" } } },
  },
  {
    name: "Deal Risk Scorer",
    category: "Sales",
    description: "Scores an open deal's risk of stalling or falling through from its activity history.",
    details:
      "Scores an open sales deal's risk of stalling or falling through, based on its stage, days since last activity, and stakeholder engagement — returning the specific risk factors driving the score. Lets a pipeline-monitoring agent flag at-risk deals before they go cold.",
    priceSats: 55,
    inputSchema: {
      type: "object",
      required: ["stage", "days_since_activity", "stakeholders_engaged"],
      properties: {
        stage: { type: "string" },
        days_since_activity: { type: "number" },
        stakeholders_engaged: { type: "number" },
      },
    },
    outputSchema: {
      type: "object",
      required: ["risk_score", "risk_factors"],
      properties: { risk_score: { type: "number" }, risk_factors: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Meeting Prep Briefing Agent",
    category: "Sales",
    description: "Builds a pre-meeting briefing on a company and the people you're meeting.",
    details:
      "Given a company name and the names of the people you're about to meet, builds a short briefing — company context, likely priorities, recent news — so a sales or partnerships agent walks in prepared instead of scrambling five minutes before the call.",
    priceSats: 60,
    inputSchema: {
      type: "object",
      required: ["company_name", "attendees"],
      properties: { company_name: { type: "string" }, attendees: { type: "array", items: { type: "string" } } },
    },
    outputSchema: { type: "object", required: ["briefing"], properties: { briefing: { type: "string" } } },
  },

  // ---- Writing ----
  {
    name: "Blog Outline Generator",
    category: "Writing",
    description: "Generates a structured outline for a blog post from a topic and target keyword.",
    details:
      "Turns a topic and a target keyword into a structured blog outline — headings, subpoints, and a suggested angle — ready for a writer or content-generation agent to draft from. Skips the blank-page stage of every post.",
    priceSats: 30,
    inputSchema: {
      type: "object",
      required: ["topic", "target_keyword"],
      properties: { topic: { type: "string" }, target_keyword: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["outline"], properties: { outline: { type: "array", items: { type: "string" } } } },
  },
  {
    name: "Resume Bullet Point Rewriter",
    category: "Writing",
    description: "Rewrites a weak resume bullet point into an achievement-focused one.",
    details:
      "Rewrites a flat, task-focused resume bullet point into an achievement-focused one with concrete impact language, staying truthful to the facts given. Useful for a career-coaching agent helping a candidate's resume actually stand out.",
    priceSats: 20,
    inputSchema: { type: "object", required: ["bullet_point"], properties: { bullet_point: { type: "string" } } },
    outputSchema: { type: "object", required: ["rewritten"], properties: { rewritten: { type: "string" } } },
  },
  {
    name: "Press Release Drafting Agent",
    category: "Writing",
    description: "Drafts a press release in AP style from the key facts of an announcement.",
    details:
      "Turns the key facts of an announcement — what, who, when, why it matters — into a properly structured press release in AP style, headline and boilerplate included. Gives a comms agent a publish-ready first draft instead of a bullet list.",
    priceSats: 55,
    inputSchema: {
      type: "object",
      required: ["announcement_facts", "company_name"],
      properties: { announcement_facts: { type: "string" }, company_name: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["press_release"], properties: { press_release: { type: "string" } } },
  },
  {
    name: "Product Description Writer",
    category: "Writing",
    description: "Writes an e-commerce product description from a spec sheet.",
    details:
      "Turns a raw spec sheet into a persuasive, benefit-led e-commerce product description tuned to the target audience. Built for a catalog-management agent listing products faster than a copywriter could keep up with.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["spec_sheet", "target_audience"],
      properties: { spec_sheet: { type: "string" }, target_audience: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["description"], properties: { description: { type: "string" } } },
  },

  // ---- Productivity ----
  {
    name: "Calendar Scheduling Optimizer Agent",
    category: "Productivity",
    description: "Finds the best meeting slot across attendees' stated availability and preferences.",
    details:
      "Given each attendee's available time blocks and stated preferences (no early mornings, prefer afternoons), returns the best-fit meeting slot with a brief rationale. Saves a scheduling agent — or a human — the back-and-forth of finding a time that actually works for everyone.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["availabilities", "duration_minutes"],
      properties: { availabilities: { type: "array" }, duration_minutes: { type: "number" } },
    },
    outputSchema: {
      type: "object",
      required: ["suggested_slot", "rationale"],
      properties: { suggested_slot: { type: "string" }, rationale: { type: "string" } },
    },
  },
  {
    name: "Task Prioritization Agent",
    category: "Productivity",
    description: "Ranks a task list by urgency and impact.",
    details:
      "Takes a raw task list with rough due dates and effort estimates, and returns a ranked priority order with the reasoning behind it. Useful for any agent managing a shared backlog that needs a defensible \"do this first\" answer, not just a flat list.",
    priceSats: 20,
    inputSchema: { type: "object", required: ["tasks"], properties: { tasks: { type: "array" } } },
    outputSchema: {
      type: "object",
      required: ["ranked_tasks"],
      properties: { ranked_tasks: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Daily Standup Digest Agent",
    category: "Productivity",
    description: "Turns raw standup notes from a team into a structured digest.",
    details:
      "Turns a pile of raw daily-standup notes from a team into a structured digest — what shipped, what's blocked, who needs help — so a lead doesn't have to read every individual update to know the state of the team.",
    priceSats: 25,
    inputSchema: { type: "object", required: ["raw_notes"], properties: { raw_notes: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["shipped", "blocked"],
      properties: { shipped: { type: "array", items: { type: "string" } }, blocked: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Handwriting-to-Task OCR Agent",
    category: "Productivity",
    description: "Converts a photo of handwritten notes into a structured task list.",
    details:
      "Reads a photo of handwritten notes — a whiteboard, a notebook page — and converts anything that reads as an action item into a structured task list. Bridges the gap between a physical meeting and a digital task tracker without manual re-typing.",
    priceSats: 30,
    inputSchema: { type: "object", required: ["image_url"], properties: { image_url: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["tasks"],
      properties: { tasks: { type: "array", items: { type: "string" } } },
    },
  },

  // ---- Compliance ----
  {
    name: "GDPR Data Request Handler Agent",
    category: "Compliance",
    description: "Drafts a response to a GDPR data subject access/erasure request.",
    details:
      "Given a data subject's access or erasure request and a description of what data you hold on them, drafts a compliant response and a checklist of internal systems that need action. Helps a compliance agent hit GDPR's response deadlines without missing a required step.",
    priceSats: 120,
    inputSchema: {
      type: "object",
      required: ["request_type", "data_held_description"],
      properties: { request_type: { type: "string" }, data_held_description: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["response_draft", "action_checklist"],
      properties: { response_draft: { type: "string" }, action_checklist: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "SOC2 Evidence Collector Agent",
    category: "Compliance",
    description: "Maps a described control to the SOC2 trust-service criteria it satisfies.",
    details:
      "Given a plain description of an internal control (e.g. \"access reviews run quarterly\"), maps it to the specific SOC2 trust-service criteria it provides evidence for, and flags gaps. Helps a compliance agent build an audit-ready evidence map without manually cross-referencing the framework.",
    priceSats: 140,
    inputSchema: { type: "object", required: ["control_description"], properties: { control_description: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["criteria_satisfied", "gaps"],
      properties: {
        criteria_satisfied: { type: "array", items: { type: "string" } },
        gaps: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "AML Transaction Screening Agent",
    category: "Compliance",
    description: "Screens a transaction against AML red-flag patterns and sanctions-style risk factors.",
    details:
      "Screens a single transaction's amount, counterparties, and pattern against common anti-money-laundering red flags — structuring, high-risk jurisdictions, unusual velocity — and returns a risk rating with the specific flags triggered. A fast first-pass screen before a compliance officer's manual review.",
    priceSats: 160,
    inputSchema: {
      type: "object",
      required: ["amount", "counterparty", "jurisdiction"],
      properties: { amount: { type: "number" }, counterparty: { type: "string" }, jurisdiction: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["risk_rating", "flags"],
      properties: { risk_rating: { type: "string" }, flags: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Accessibility (WCAG) Audit Agent",
    category: "Compliance",
    description: "Audits a page's HTML for WCAG violations and returns fixable findings.",
    details:
      "Audits a page's HTML against WCAG 2.1 success criteria — missing alt text, poor contrast, unlabeled form fields — and returns each violation with the specific fix needed. Lets a dev or compliance agent catch accessibility issues before launch, not after a complaint.",
    priceSats: 90,
    inputSchema: { type: "object", required: ["html"], properties: { html: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["violations"],
      properties: {
        violations: {
          type: "array",
          items: {
            type: "object",
            required: ["criterion", "fix"],
            properties: { criterion: { type: "string" }, fix: { type: "string" } },
          },
        },
      },
    },
  },

  // ---- Finance ----
  {
    name: "Invoice Payment Terms Analyzer",
    category: "Finance",
    description: "Flags unfavorable payment terms in an invoice or contract.",
    details:
      "Reads an invoice or contract's payment terms and flags anything unfavorable — unusually long payment windows, early-payment penalties, missing late-fee terms — with a plain-language explanation of each. Helps an accounts-payable agent catch a bad term before it's signed off on.",
    priceSats: 35,
    inputSchema: { type: "object", required: ["document_text"], properties: { document_text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["flags"],
      properties: { flags: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Expense Categorization Agent",
    category: "Finance",
    description: "Categorizes a batch of raw expense line items into standard accounting categories.",
    details:
      "Takes a batch of raw expense line items (vendor, amount, description) and categorizes each into standard accounting categories, ready to drop into a ledger. Saves a bookkeeping agent from manually tagging every transaction.",
    priceSats: 20,
    inputSchema: { type: "object", required: ["expenses"], properties: { expenses: { type: "array" } } },
    outputSchema: {
      type: "object",
      required: ["categorized"],
      properties: {
        categorized: {
          type: "array",
          items: {
            type: "object",
            required: ["description", "category"],
            properties: { description: { type: "string" }, category: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Financial Ratio Calculator Agent",
    category: "Finance",
    description: "Calculates standard financial ratios from a set of balance-sheet and income figures.",
    details:
      "Calculates the standard financial ratios — current ratio, debt-to-equity, gross margin — from a set of supplied balance-sheet and income-statement figures, with a one-line read on what each ratio suggests. A quick sanity check for a finance agent evaluating a company's health.",
    priceSats: 25,
    inputSchema: { type: "object", required: ["financials"], properties: { financials: { type: "object" } } },
    outputSchema: {
      type: "object",
      required: ["ratios"],
      properties: { ratios: { type: "object" } },
    },
  },

  // ---- Customer Support ----
  {
    name: "Support Ticket Triage Agent",
    category: "Customer Support",
    description: "Classifies an incoming support ticket by category, urgency, and suggested team.",
    details:
      "Classifies an incoming support ticket by category, urgency, and the team best suited to handle it, so tickets land in the right queue automatically instead of sitting in a general inbox waiting for a human to sort them.",
    priceSats: 15,
    inputSchema: { type: "object", required: ["ticket_text"], properties: { ticket_text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["category", "urgency", "suggested_team"],
      properties: { category: { type: "string" }, urgency: { type: "string" }, suggested_team: { type: "string" } },
    },
  },
  {
    name: "Canned Response Generator",
    category: "Customer Support",
    description: "Drafts a support reply from a ticket and the relevant help-doc excerpt.",
    details:
      "Drafts a reply to a support ticket using the relevant help-doc excerpt as its source of truth, in the company's support tone. Gives a support agent a ready-to-send draft instead of writing every reply from scratch.",
    priceSats: 15,
    inputSchema: {
      type: "object",
      required: ["ticket_text", "help_doc_excerpt"],
      properties: { ticket_text: { type: "string" }, help_doc_excerpt: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["reply_draft"], properties: { reply_draft: { type: "string" } } },
  },
  {
    name: "Customer Churn Risk Scorer",
    category: "Customer Support",
    description: "Scores a customer's churn risk from usage and support-interaction history.",
    details:
      "Scores a customer's likelihood of churning based on usage trend and recent support-interaction history, with the specific signals behind the score. Lets a retention agent reach out proactively to the accounts most at risk instead of reacting after a cancellation.",
    priceSats: 70,
    inputSchema: {
      type: "object",
      required: ["usage_trend", "recent_tickets"],
      properties: { usage_trend: { type: "string" }, recent_tickets: { type: "number" } },
    },
    outputSchema: {
      type: "object",
      required: ["churn_risk", "signals"],
      properties: { churn_risk: { type: "number" }, signals: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Live Chat Sentiment Monitor",
    category: "Customer Support",
    description: "Scores the sentiment trajectory of an ongoing live chat conversation.",
    details:
      "Scores an in-progress live chat conversation for sentiment trajectory turn by turn, flagging the point where a customer's tone turns negative. Lets an escalation agent step in before a frustrated customer gives up on the chat entirely.",
    priceSats: 15,
    inputSchema: { type: "object", required: ["chat_transcript"], properties: { chat_transcript: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["overall_sentiment", "turning_point"],
      properties: { overall_sentiment: { type: "string" }, turning_point: { type: "string" } },
    },
  },
  {
    name: "Help Center Article Gap Finder",
    category: "Customer Support",
    description: "Compares recent ticket topics against existing help articles to find missing docs.",
    details:
      "Compares a batch of recent support ticket topics against your existing help-center article titles and returns the topics with no matching article — the gaps actually costing you repeat tickets. Turns a support agent's backlog into a documentation to-do list.",
    priceSats: 45,
    inputSchema: {
      type: "object",
      required: ["ticket_topics", "existing_articles"],
      properties: { ticket_topics: { type: "array", items: { type: "string" } }, existing_articles: { type: "array", items: { type: "string" } } },
    },
    outputSchema: {
      type: "object",
      required: ["gaps"],
      properties: { gaps: { type: "array", items: { type: "string" } } },
    },
  },

  // ---- HR ----
  {
    name: "Resume Screening Agent",
    category: "HR",
    description: "Scores a resume against a job description's stated requirements.",
    details:
      "Scores a candidate's resume against a job description's stated requirements, returning a match score and which specific requirements are and aren't met. Helps a recruiting agent triage a large applicant pool down to the ones worth a human's time.",
    priceSats: 35,
    inputSchema: {
      type: "object",
      required: ["resume_text", "job_description"],
      properties: { resume_text: { type: "string" }, job_description: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["match_score", "unmet_requirements"],
      properties: { match_score: { type: "number" }, unmet_requirements: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Job Description Writer",
    category: "HR",
    description: "Writes a job description from a role title and a list of key responsibilities.",
    details:
      "Turns a role title and a rough list of key responsibilities into a complete, well-structured job description — summary, responsibilities, qualifications — ready to post. Saves a hiring agent from reinventing the format for every open role.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["role_title", "responsibilities"],
      properties: { role_title: { type: "string" }, responsibilities: { type: "array", items: { type: "string" } } },
    },
    outputSchema: { type: "object", required: ["job_description"], properties: { job_description: { type: "string" } } },
  },
  {
    name: "Candidate Interview Question Generator",
    category: "HR",
    description: "Generates targeted interview questions for a role and seniority level.",
    details:
      "Generates a set of targeted interview questions tuned to a specific role and seniority level, covering both technical and behavioral angles. Gives an interviewing agent — or a hiring manager short on prep time — a solid question set instead of generic ones.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["role_title", "seniority"],
      properties: { role_title: { type: "string" }, seniority: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["questions"],
      properties: { questions: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Offer Letter Generator",
    category: "HR",
    description: "Generates an offer letter from role, compensation, and start-date details.",
    details:
      "Generates a complete, correctly formatted offer letter from the role title, compensation package, and start date — ready for legal's final look, not a blank template. Speeds up the gap between a verbal offer and a signed one.",
    priceSats: 20,
    inputSchema: {
      type: "object",
      required: ["role_title", "compensation", "start_date"],
      properties: { role_title: { type: "string" }, compensation: { type: "string" }, start_date: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["offer_letter"], properties: { offer_letter: { type: "string" } } },
  },
  {
    name: "Employee Onboarding Checklist Agent",
    category: "HR",
    description: "Builds a role-specific onboarding checklist with owners and due dates.",
    details:
      "Builds a role-specific onboarding checklist — accounts to provision, docs to sign, training to schedule — each with a suggested owner and due date relative to the start date. Keeps a new hire's first two weeks from depending on someone remembering every step.",
    priceSats: 20,
    inputSchema: {
      type: "object",
      required: ["role_title", "start_date"],
      properties: { role_title: { type: "string" }, start_date: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["checklist"],
      properties: {
        checklist: {
          type: "array",
          items: {
            type: "object",
            required: ["task", "owner", "due_date"],
            properties: { task: { type: "string" }, owner: { type: "string" }, due_date: { type: "string" } },
          },
        },
      },
    },
  },

  // ---- DevOps ----
  {
    name: "Uptime & Incident Summary Agent",
    category: "DevOps",
    description: "Summarizes a set of monitoring alerts into a single incident narrative.",
    details:
      "Takes a raw list of monitoring alerts from an incident window and summarizes them into a single coherent narrative — what broke, when, and the likely trigger. Feeds directly into a postmortem or status-page update instead of a wall of raw alert logs.",
    priceSats: 30,
    inputSchema: { type: "object", required: ["alerts"], properties: { alerts: { type: "array" } } },
    outputSchema: {
      type: "object",
      required: ["narrative", "likely_trigger"],
      properties: { narrative: { type: "string" }, likely_trigger: { type: "string" } },
    },
  },
  {
    name: "Log Anomaly Detector",
    category: "DevOps",
    description: "Flags anomalous lines in a log file relative to its normal pattern.",
    details:
      "Scans a log file and flags the lines that break from the file's normal pattern — an unusual error rate, a repeated stack trace, a spike in a specific status code — with a reason for each flag. A fast first pass before an on-call engineer reads the whole file.",
    priceSats: 70,
    inputSchema: { type: "object", required: ["log_text"], properties: { log_text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["anomalies"],
      properties: {
        anomalies: {
          type: "array",
          items: {
            type: "object",
            required: ["line", "reason"],
            properties: { line: { type: "string" }, reason: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Cloud Cost Optimizer Agent",
    category: "DevOps",
    description: "Reviews a cloud billing breakdown and suggests concrete cost cuts.",
    details:
      "Reviews a cloud billing breakdown by service and returns concrete, specific savings opportunities — idle resources, oversized instances, missing reserved-capacity discounts — each with an estimated monthly savings. Gives a FinOps agent a prioritized list instead of a spreadsheet to comb through.",
    priceSats: 90,
    inputSchema: { type: "object", required: ["billing_breakdown"], properties: { billing_breakdown: { type: "object" } } },
    outputSchema: {
      type: "object",
      required: ["recommendations"],
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            required: ["action", "estimated_monthly_savings_usd"],
            properties: { action: { type: "string" }, estimated_monthly_savings_usd: { type: "number" } },
          },
        },
      },
    },
  },
  {
    name: "CI Pipeline Failure Diagnoser",
    category: "DevOps",
    description: "Diagnoses the likely root cause of a failed CI run from its log output.",
    details:
      "Reads a failed CI pipeline's log output and returns the likely root cause and the specific step that failed, cutting through hundreds of lines of build noise. Lets a deployment agent retry with a fix instead of re-running the whole pipeline blind.",
    priceSats: 50,
    inputSchema: { type: "object", required: ["ci_log"], properties: { ci_log: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["failed_step", "likely_cause"],
      properties: { failed_step: { type: "string" }, likely_cause: { type: "string" } },
    },
  },
  {
    name: "Container Image Vulnerability Scanner",
    category: "DevOps",
    description: "Scans a container image's package manifest for known CVEs by layer.",
    details:
      "Scans a container image's installed-package manifest for known CVEs and returns each finding with the layer it came from, so a build agent knows exactly which base image or install step introduced the risk — not just that the final image has one.",
    priceSats: 80,
    inputSchema: { type: "object", required: ["package_manifest"], properties: { package_manifest: { type: "array" } } },
    outputSchema: {
      type: "object",
      required: ["findings"],
      properties: {
        findings: {
          type: "array",
          items: {
            type: "object",
            required: ["package", "cve", "layer"],
            properties: { package: { type: "string" }, cve: { type: "string" }, layer: { type: "string" } },
          },
        },
      },
    },
  },

  // ---- E-commerce ----
  {
    name: "Product Catalog Enrichment Agent",
    category: "E-commerce",
    description: "Fills in missing catalog fields for a product from its title and available specs.",
    details:
      "Given a bare product title and whatever specs are available, fills in the missing catalog fields — category, attributes, a search-friendly description — needed for a complete listing. Lets a catalog-management agent onboard supplier feeds that arrive incomplete.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["product_title", "known_specs"],
      properties: { product_title: { type: "string" }, known_specs: { type: "object" } },
    },
    outputSchema: {
      type: "object",
      required: ["category", "attributes", "description"],
      properties: { category: { type: "string" }, attributes: { type: "object" }, description: { type: "string" } },
    },
  },
  {
    name: "Abandoned Cart Recovery Copy Agent",
    category: "E-commerce",
    description: "Writes a personalized abandoned-cart recovery email for the items left behind.",
    details:
      "Writes a personalized abandoned-cart recovery email referencing the specific items a shopper left behind, tuned toward a gentle nudge rather than a hard sell. Built for a lifecycle-marketing agent sending these at volume without every email reading identical.",
    priceSats: 20,
    inputSchema: {
      type: "object",
      required: ["cart_items", "customer_name"],
      properties: { cart_items: { type: "array", items: { type: "string" } }, customer_name: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["email_copy"], properties: { email_copy: { type: "string" } } },
  },
  {
    name: "Review Summarization Agent",
    category: "E-commerce",
    description: "Summarizes a batch of product reviews into common praise and complaint themes.",
    details:
      "Reads a batch of product reviews and summarizes the recurring themes — what customers consistently praise and what they consistently complain about — instead of a raw star-rating average. Gives a merchandising agent an actual read on product sentiment.",
    priceSats: 30,
    inputSchema: { type: "object", required: ["reviews"], properties: { reviews: { type: "array", items: { type: "string" } } } },
    outputSchema: {
      type: "object",
      required: ["praise_themes", "complaint_themes"],
      properties: { praise_themes: { type: "array", items: { type: "string" } }, complaint_themes: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Shipping Cost Estimator",
    category: "E-commerce",
    description: "Estimates shipping cost for a package given dimensions, weight, and destination.",
    details:
      "Estimates the shipping cost for a package given its dimensions, weight, and destination, checked against standard carrier rate patterns. A cheap utility call for a checkout agent that needs a real-time estimate before a customer commits to buy.",
    priceSats: 12,
    inputSchema: {
      type: "object",
      required: ["weight_kg", "dimensions_cm", "destination"],
      properties: { weight_kg: { type: "number" }, dimensions_cm: { type: "array", items: { type: "number" } }, destination: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["estimated_cost_usd"], properties: { estimated_cost_usd: { type: "number" } } },
  },
  {
    name: "Return Reason Classifier",
    category: "E-commerce",
    description: "Classifies a customer's free-text return reason into a standard category.",
    details:
      "Classifies a customer's free-text return reason into a standard category (defective, wrong size, changed mind, not as described) so a returns-processing agent can route and report on returns consistently instead of parsing free text by hand.",
    priceSats: 15,
    inputSchema: { type: "object", required: ["return_reason_text"], properties: { return_reason_text: { type: "string" } } },
    outputSchema: { type: "object", required: ["category"], properties: { category: { type: "string" } } },
  },

  // ---- Real Estate ----
  {
    name: "Property Listing Description Generator",
    category: "Real Estate",
    description: "Writes a property listing description from its features and neighborhood.",
    details:
      "Turns a property's raw feature list and neighborhood into a persuasive listing description tuned to the property type — nobody wants a starter condo described like a luxury estate. Lets a listing agent get every property live faster.",
    priceSats: 25,
    inputSchema: {
      type: "object",
      required: ["features", "neighborhood"],
      properties: { features: { type: "array", items: { type: "string" } }, neighborhood: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["listing_description"], properties: { listing_description: { type: "string" } } },
  },
  {
    name: "Comparable Sales (Comps) Finder",
    category: "Real Estate",
    description: "Returns comparable recent sales for a property given its specs and location.",
    details:
      "Given a property's specs and location, returns comparable recent sales with their prices and key differences, feeding straight into a pricing recommendation. Saves an agent or valuation tool the manual comp-pulling grind.",
    priceSats: 60,
    inputSchema: {
      type: "object",
      required: ["address", "square_feet", "bedrooms"],
      properties: { address: { type: "string" }, square_feet: { type: "number" }, bedrooms: { type: "number" } },
    },
    outputSchema: {
      type: "object",
      required: ["comparables"],
      properties: {
        comparables: {
          type: "array",
          items: {
            type: "object",
            required: ["address", "sale_price", "sale_date"],
            properties: { address: { type: "string" }, sale_price: { type: "number" }, sale_date: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Lease Clause Risk Flagger",
    category: "Real Estate",
    description: "Flags risky or unusual clauses in a residential or commercial lease.",
    details:
      "Reads a lease and flags clauses that are unusually one-sided or worth a second look — uncapped rent increases, vague maintenance obligations, unusual termination terms — with a plain-language explanation of the risk. A fast first pass before signing, not a substitute for legal review.",
    priceSats: 90,
    inputSchema: { type: "object", required: ["lease_text"], properties: { lease_text: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["flagged_clauses"],
      properties: {
        flagged_clauses: {
          type: "array",
          items: {
            type: "object",
            required: ["clause", "risk"],
            properties: { clause: { type: "string" }, risk: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Rental Yield Calculator",
    category: "Real Estate",
    description: "Calculates gross and net rental yield from purchase price, rent, and expenses.",
    details:
      "Calculates gross and net rental yield from a property's purchase price, expected monthly rent, and estimated expenses. A quick, standardized number for an investment agent comparing multiple properties side by side.",
    priceSats: 15,
    inputSchema: {
      type: "object",
      required: ["purchase_price", "monthly_rent", "annual_expenses"],
      properties: { purchase_price: { type: "number" }, monthly_rent: { type: "number" }, annual_expenses: { type: "number" } },
    },
    outputSchema: {
      type: "object",
      required: ["gross_yield_pct", "net_yield_pct"],
      properties: { gross_yield_pct: { type: "number" }, net_yield_pct: { type: "number" } },
    },
  },
  {
    name: "Neighborhood Data Summary Agent",
    category: "Real Estate",
    description: "Summarizes key neighborhood stats — schools, commute, amenities — for an address.",
    details:
      "Given an address, summarizes the neighborhood context a buyer actually cares about — school ratings, typical commute times, nearby amenities — in one structured summary instead of five separate site lookups.",
    priceSats: 35,
    inputSchema: { type: "object", required: ["address"], properties: { address: { type: "string" } } },
    outputSchema: {
      type: "object",
      required: ["summary"],
      properties: { summary: { type: "string" } },
    },
  },

  // ---- Logistics ----
  {
    name: "Shipment Route Optimizer",
    category: "Logistics",
    description: "Returns the lowest-cost/fastest route across a set of delivery stops.",
    details:
      "Given a set of delivery stops and a vehicle's constraints, returns an optimized route ordering that minimizes total distance or time. Plugs straight into a fleet-dispatch agent that would otherwise route stops in whatever order they arrived.",
    priceSats: 60,
    inputSchema: {
      type: "object",
      required: ["stops", "start_location"],
      properties: { stops: { type: "array", items: { type: "string" } }, start_location: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["ordered_stops", "estimated_total_distance_km"],
      properties: { ordered_stops: { type: "array", items: { type: "string" } }, estimated_total_distance_km: { type: "number" } },
    },
  },
  {
    name: "Customs Documentation Checker",
    category: "Logistics",
    description: "Checks a shipment's customs paperwork for missing or inconsistent fields.",
    details:
      "Checks a shipment's customs declaration and commercial invoice for missing fields or inconsistencies between the two documents — the kind of mismatch that gets a shipment held at the border. A fast pre-flight check before a shipment ever leaves the warehouse.",
    priceSats: 70,
    inputSchema: {
      type: "object",
      required: ["customs_declaration", "commercial_invoice"],
      properties: { customs_declaration: { type: "object" }, commercial_invoice: { type: "object" } },
    },
    outputSchema: {
      type: "object",
      required: ["issues"],
      properties: { issues: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "Travel Itinerary Builder",
    category: "Logistics",
    description: "Builds a day-by-day travel itinerary from a destination, dates, and preferences.",
    details:
      "Builds a day-by-day travel itinerary from a destination, date range, and stated preferences (pace, interests, budget level), balancing travel time against how much is actually plannable in a day. Gives a travel-planning agent a real starting itinerary, not just a list of attractions.",
    priceSats: 30,
    inputSchema: {
      type: "object",
      required: ["destination", "start_date", "end_date"],
      properties: { destination: { type: "string" }, start_date: { type: "string" }, end_date: { type: "string" } },
    },
    outputSchema: {
      type: "object",
      required: ["itinerary"],
      properties: {
        itinerary: {
          type: "array",
          items: {
            type: "object",
            required: ["day", "plan"],
            properties: { day: { type: "string" }, plan: { type: "string" } },
          },
        },
      },
    },
  },
  {
    name: "Freight Quote Comparator",
    category: "Logistics",
    description: "Compares freight quotes from multiple carriers and recommends the best value.",
    details:
      "Compares freight quotes from multiple carriers for the same shipment and recommends the best value — not just the lowest price, but weighing transit time and reliability history too. Saves a procurement or logistics agent from a manual spreadsheet comparison every time.",
    priceSats: 25,
    inputSchema: { type: "object", required: ["quotes"], properties: { quotes: { type: "array" } } },
    outputSchema: {
      type: "object",
      required: ["recommended_carrier", "rationale"],
      properties: { recommended_carrier: { type: "string" }, rationale: { type: "string" } },
    },
  },
  {
    name: "Delivery ETA Predictor",
    category: "Logistics",
    description: "Predicts a delivery ETA from origin, destination, and carrier transit patterns.",
    details:
      "Predicts a realistic delivery ETA from an origin, destination, and carrier, accounting for typical transit patterns rather than just a straight-line distance estimate. Feeds a customer-facing tracking agent with an ETA that's actually trustworthy.",
    priceSats: 20,
    inputSchema: {
      type: "object",
      required: ["origin", "destination", "carrier"],
      properties: { origin: { type: "string" }, destination: { type: "string" }, carrier: { type: "string" } },
    },
    outputSchema: { type: "object", required: ["estimated_delivery_date"], properties: { estimated_delivery_date: { type: "string" } } },
  },
];

async function main() {
  const adminIsNew = !(await db.operator.findUnique({ where: { email: "admin@agentixshop.dev" }, select: { id: true } }));
  const adminPlaintext = seedPassword();
  const adminPassword = await bcrypt.hash(adminPlaintext, 10);
  const admin = await db.operator.upsert({
    where: { email: "admin@agentixshop.dev" },
    update: {},
    create: { email: "admin@agentixshop.dev", passwordHash: adminPassword, role: "admin", apiKey: apiKey() },
  });

  const sellerIsNew = !(await db.operator.findUnique({ where: { email: "verified@agentixshop.dev" }, select: { id: true } }));
  const sellerPlaintext = seedPassword();
  const sellerPassword = await bcrypt.hash(sellerPlaintext, 10);
  const seller = await db.operator.upsert({
    where: { email: "verified@agentixshop.dev" },
    update: {},
    create: {
      email: "verified@agentixshop.dev",
      passwordHash: sellerPassword,
      role: "seller",
      name: "Agentix Verified",
      apiKey: apiKey(),
    },
  });

  for (const listing of LISTINGS) {
    const existing = await db.listing.findFirst({ where: { name: listing.name, sellerId: seller.id } });
    if (!existing) {
      await db.listing.create({ data: { ...listing, sellerId: seller.id } });
    } else if (existing.details !== listing.details) {
      await db.listing.update({ where: { id: existing.id }, data: { details: listing.details } });
    }
  }

  const demoPlaintext = seedPassword();
  const demoPassword = await bcrypt.hash(demoPlaintext, 10);
  const BUYER_ACCOUNTS = [
    { email: "demo-buyer@agentixshop.dev", spendCapDailySats: 5000 },
    { email: "acme-research@agentixshop.dev", spendCapDailySats: 3000 },
    { email: "northwind-ops@agentixshop.dev", spendCapDailySats: 8000 },
    { email: "lumen-support@agentixshop.dev", spendCapDailySats: 2000 },
  ];
  const buyers = [];
  let anyBuyerIsNew = false;
  for (const b of BUYER_ACCOUNTS) {
    const existing = await db.operator.findUnique({ where: { email: b.email }, select: { id: true } });
    if (!existing) anyBuyerIsNew = true;
    const buyer = await db.operator.upsert({
      where: { email: b.email },
      update: {},
      create: {
        email: b.email,
        passwordHash: demoPassword,
        role: "buyer",
        apiKey: apiKey(),
        spendCapDailySats: b.spendCapDailySats,
      },
    });
    buyers.push(buyer);
  }

  // Demo order + audit-log history — gives both the admin dashboards and
  // the operator dashboard something real to look at out of the box.
  // Gated on order count so re-running the seed doesn't pile up duplicates.
  const existingOrderCount = await db.order.count();
  if (existingOrderCount === 0) {
    const allListings = await db.listing.findMany({ where: { sellerId: seller.id } });
    const DEMO_ORDER_COUNT = 48;

    for (let i = 0; i < DEMO_ORDER_COUNT; i++) {
      const listing = allListings[Math.floor(Math.random() * allListings.length)];
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      const input = SAMPLE_INPUTS[listing.name] ?? {};

      // First few orders are guaranteed "today" so the dashboards never
      // look empty on the current day; the rest spread across 30 days.
      const createdAt = i < 4 ? daysAgo(0) : daysAgo(Math.floor(Math.random() * 29) + 1);

      const roll = Math.random();
      const status = roll < 0.72 ? "settled" : roll < 0.85 ? "disputed" : roll < 0.93 ? "refunded" : "pending_payment";

      const data: Prisma.OrderCreateInput = {
        buyer: { connect: { id: buyer.id } },
        seller: { connect: { id: seller.id } },
        listing: { connect: { id: listing.id } },
        input: input as Prisma.InputJsonValue,
        amountSats: listing.priceSats,
        railInvoiceRef: fakeInvoice(),
        railPaymentHash: randomHash(),
        status,
        createdAt,
      };

      if (status === "settled") {
        data.output = demoOutput(listing.name) as Prisma.InputJsonValue;
        data.verificationResult = "pass";
        // No third-party seller registered yet — see lib/fees.ts — so the
        // full amount is retained as platform revenue, same as production.
        data.platformFeeSats = listing.priceSats;
        data.paidAt = createdAt;
        data.settledAt = new Date(createdAt.getTime() + 2000 + Math.random() * 6000);
      } else if (status === "disputed") {
        data.output = demoOutput(listing.name) as Prisma.InputJsonValue;
        data.verificationResult = "fail";
        data.failureNote = "Output failed schema verification against the listing's outputSchema.";
        data.paidAt = createdAt;
      } else if (status === "refunded") {
        data.verificationResult = "fail";
        data.failureNote = "Verification failed; refunded to buyer after the grace window.";
        data.paidAt = createdAt;
      }

      const order = await db.order.create({ data });

      await db.auditLogEntry.create({
        data: {
          operatorId: buyer.id,
          action: "search",
          detail: { category: listing.category } as Prisma.InputJsonValue,
          createdAt,
        },
      });
      await db.auditLogEntry.create({
        data: {
          operatorId: buyer.id,
          action: "purchase",
          detail: { orderId: order.id, listingId: listing.id, amountSats: listing.priceSats } as Prisma.InputJsonValue,
          createdAt,
        },
      });
      if (status === "settled" || status === "disputed") {
        await db.auditLogEntry.create({
          data: {
            operatorId: buyer.id,
            action: "verification",
            detail: { orderId: order.id, pass: status === "settled" } as Prisma.InputJsonValue,
            createdAt: order.settledAt ?? createdAt,
          },
        });
      }
      if (status === "disputed") {
        await db.auditLogEntry.create({
          data: {
            operatorId: buyer.id,
            action: "dispute",
            detail: { orderId: order.id, reason: data.failureNote } as Prisma.InputJsonValue,
            createdAt,
          },
        });
      }
    }

    // Reflect today's demo orders in each buyer's daily spend-cap usage.
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    for (const buyer of buyers) {
      const todaysOrders = await db.order.findMany({
        where: { buyerId: buyer.id, createdAt: { gte: todayStart } },
        select: { amountSats: true },
      });
      const used = todaysOrders.reduce((sum, o) => sum + o.amountSats, 0);
      await db.operator.update({
        where: { id: buyer.id },
        data: { spendUsedTodaySats: Math.min(used, buyer.spendCapDailySats), spendResetAt: new Date() },
      });
    }

    await recalcAllReputations(allListings.map((l) => l.id));
  }

  console.log(
    `Seeded: admin=${admin.email}, seller=${seller.email} (${LISTINGS.length} listings), buyers=${buyers.length}, orders=${await db.order.count()}`
  );

  // Generated passwords only apply to accounts created just now — an
  // existing account's real password isn't touched by upsert's `update: {}`.
  const newAccountLines: string[] = [];
  if (adminIsNew) newAccountLines.push(`  ${admin.email}: ${adminPlaintext}`);
  if (sellerIsNew) newAccountLines.push(`  ${seller.email}: ${sellerPlaintext}`);
  if (anyBuyerIsNew) newAccountLines.push(...BUYER_ACCOUNTS.map((b) => `  ${b.email}: ${demoPlaintext}`));
  if (newAccountLines.length > 0) {
    console.log("\nGenerated passwords for newly-created accounts (save these, they won't be shown again):");
    console.log(newAccountLines.join("\n"));
  }
}

async function recalcAllReputations(listingIds: string[]) {
  for (const listingId of listingIds) {
    const orders = await db.order.findMany({ where: { listingId, status: { in: ["settled", "disputed", "refunded"] } } });
    if (orders.length === 0) continue;
    const settled = orders.filter((o) => o.status === "settled").length;
    const successRate = settled / orders.length;
    const disputeRate = orders.filter((o) => o.status !== "settled").length / orders.length;
    const reputation = Math.max(1, Math.min(5, 5 * successRate - disputeRate * 2));
    await db.listing.update({ where: { id: listingId }, data: { successRate, reputation } });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
