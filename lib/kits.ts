// Agent kits: a bundle for one job. A kit is a set of marketplace skills, ready-made instructions for the
// agent that will use them, and a few tasks to try first. Kits are defined here in code (like the prompt
// catalog) so they are reviewed and versioned; who owns which kit lives in the KitClaim table.
import { db } from "@/lib/db";
import { priceCredits } from "@/lib/credits";
import { SKILL_HANDLERS } from "@/lib/skills";

export type KitSkill = { handler: string; why: string };

export type Kit = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number; // 0 = free. Paid kits are not claimable here: they are added by the Stripe webhook.
  forWho: string;
  skills: KitSkill[];
  instructions: string; // the agent's standing instructions: paste into the agent's system prompt / custom instructions
  starterTasks: { title: string; prompt: string }[];
};

export const MCP_URL = "https://shop.getnoden.com/mcp";

export const KITS: Kit[] = [
  {
    id: "website-care",
    name: "Website Care Kit",
    tagline: "An agent that checks your site's health, watches your domain, and tells you what to fix first.",
    description:
      "Give any AI agent four real tools for looking after a website: a readiness check that shows whether AI assistants and search engines can find and read your site, a page-to-data reader, a domain and DNS lookup, and a broken-link crawler. Comes with instructions that keep the agent honest (it reports only what the tools returned) and careful with your credits.",
    priceCents: 0,
    forWho: "Small business owners, freelancers and agencies who run or look after a website and want it checked without learning technical tools.",
    skills: [
      { handler: "agent-readiness-check", why: "Scores how easy your site is for AI assistants and search engines to find and read, and lists the top fixes." },
      { handler: "web-page-to-clean-data", why: "Turns any public page into clean text, headings and links, so the agent can read it properly." },
      { handler: "domain-availability-dns", why: "Looks up a domain's registration and DNS records, and whether a name is free to register." },
      { handler: "sitemap-link-crawler", why: "Reads your sitemap and checks up to 50 pages for broken links and redirects." },
    ],
    instructions: `You are a website care assistant. You help the owner of a website find out what is wrong with it and what to fix first, in plain language.

Tools: you have Noden skills available. Use them instead of guessing.
- agent-readiness-check: start here for any "how is my site doing" question.
- web-page-to-clean-data: use it to read a specific page's content.
- domain-availability-dns: use it for domain, registration and DNS questions.
- sitemap-link-crawler: use it to find broken links across a site.

Rules:
1. Report only what the tools returned. If a tool failed or returned nothing, say so. Never invent scores, pages, errors or DNS records.
2. Only check sites the user says they own or look after. For anyone else's site, ask first.
3. The readiness check and page reader are free (daily limits apply). The domain lookup and the crawler cost credits. Before the first paid call in a conversation, tell the user which skill you are about to run and roughly what it costs, and wait for a yes.
4. Run one skill at a time and read its result before deciding the next step. Do not call the same skill repeatedly with the same input.
5. If a call fails its check you may be given a retry_token; use it once for the same skill, then stop and tell the user.
6. Finish every report with: what you checked, what you found (most important first), and the single next thing the user should do. Keep it short enough to read in a minute.`,
    starterTasks: [
      { title: "Check how easy my site is for AI to find", prompt: "Run an agent-readiness check on https://YOUR-SITE.com and tell me my score and the three fixes that matter most, in plain language." },
      { title: "Read my pricing page", prompt: "Read https://YOUR-SITE.com/pricing and give me a clean summary of the plans, prices and anything that looks unclear to a first-time visitor." },
      { title: "Look up my domain", prompt: "Look up YOUR-SITE.com: who is it registered with, when does it expire, and are the DNS records set up sensibly? Tell me before you run it, since it costs credits." },
      { title: "Find my broken links", prompt: "Crawl the sitemap for https://YOUR-SITE.com and list any broken links or redirect chains, with the page each one is on. Confirm the credit cost with me first." },
      { title: "A monthly health report", prompt: "Do a full website health report for https://YOUR-SITE.com: readiness check, then a link crawl. Ask me before spending credits. End with a one-page summary I can forward to my web developer." },
    ],
  },
];

export const getKit = (id: string) => KITS.find((k) => k.id === id) ?? null;
export const isFreeKit = (k: Kit) => k.priceCents === 0;

export type KitSkillView = KitSkill & { listingId: string | null; name: string; credits: number };

// The live marketplace listing behind each of a kit's skills (name, link, price in credits).
export async function kitSkillViews(kit: Kit): Promise<KitSkillView[]> {
  const listings = await db.listing.findMany({ where: { handler: { in: kit.skills.map((s) => s.handler) }, active: true } });
  return kit.skills.map((s) => {
    const l = listings.find((x) => x.handler === s.handler);
    return { ...s, listingId: l?.id ?? null, name: l?.name ?? s.handler, credits: l ? priceCredits(l) : 0 };
  });
}

export const kitHandlersExist = (kit: Kit) => kit.skills.every((s) => s.handler in SKILL_HANDLERS);

// The downloadable setup file: instructions + how to connect + skills + starter tasks. Never contains a key.
export function kitMarkdown(kit: Kit, skills: KitSkillView[]): string {
  return `# ${kit.name}

${kit.tagline}

## 1. Connect your agent to Noden

- MCP server URL: ${MCP_URL}
- Authentication: send your Noden API key as \`Authorization: Bearer <your key>\`
- Your key is created when you sign up and can be regenerated from https://shop.getnoden.com/operator/dashboard
- Step-by-step for Claude and ChatGPT: https://getnoden.com/get-an-agent

REST alternative: \`POST https://shop.getnoden.com/api/v1/orders\` with \`Authorization: Bearer <your key>\`, \`{"listing_id": "...", "input": {...}}\`.

## 2. The skills in this kit

${skills.map((s) => `- **${s.name}**${s.listingId ? ` (listing id: \`${s.listingId}\`)` : ""} — ${s.why} ${s.credits === 0 ? "Free (daily limits apply)." : `${s.credits} credits per call.`}`).join("\n")}

Credits: https://shop.getnoden.com/operator/credits

## 3. Instructions for your agent

Paste this into your agent's custom instructions or system prompt.

\`\`\`
${kit.instructions}
\`\`\`

## 4. Tasks to try first

${kit.starterTasks.map((t, i) => `${i + 1}. **${t.title}**\n   ${t.prompt}`).join("\n\n")}
`;
}
