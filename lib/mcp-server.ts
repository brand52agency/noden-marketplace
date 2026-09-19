import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchListings } from "@/lib/search";
import { db } from "@/lib/db";
import { createOrder, getOrderStatus, MarketplaceError } from "@/lib/marketplace";
import { outputFieldNames } from "@/lib/schema-preview";
import { describeReputation, COMPLETED_ORDER_STATUSES } from "@/lib/reputation";

function text(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorText(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true };
}

export function createMcpServer() {
  const server = new McpServer({ name: "agentixshop", version: "1.0.0" });

  server.registerTool(
    "search_skills",
    {
      description:
        "Search the Agentix skill catalog by capability. Hybrid keyword/category match (semantic search when configured). " +
        "'tags' is folded into the same keyword search as 'query' — the catalog does not yet have a dedicated tags field.",
      inputSchema: {
        query: z.string().optional().describe("Free-text capability description, e.g. 'reviews contracts'"),
        tags: z.array(z.string()).optional().describe("Extra keywords, matched the same way as query"),
        category: z.string().optional(),
        max_price_sats: z.number().optional(),
      },
    },
    async ({ query, tags, category, max_price_sats }) => {
      const combinedQuery = [query, ...(tags ?? [])].filter(Boolean).join(" ") || undefined;
      const listings = await searchListings({ query: combinedQuery, category, maxPriceSats: max_price_sats });
      return text({
        skills: listings.map((l) => ({
          id: l.id,
          name: l.name,
          description: l.description,
          price_sats: l.priceSats,
          reputation: l.reputation,
          success_rate: l.success_rate,
          reputation_status: l.reputation_status,
        })),
      });
    }
  );

  server.registerTool(
    "get_skill",
    {
      description:
        "Get full detail on one skill listing, including the exact input JSON Schema needed to purchase it. " +
        "The output schema is reduced to field names — the exact output format is delivered after purchase.",
      inputSchema: { skill_id: z.string() },
    },
    async ({ skill_id }) => {
      const listing = await db.listing.findUnique({
        where: { id: skill_id },
        include: { _count: { select: { orders: { where: { status: { in: [...COMPLETED_ORDER_STATUSES] } } } } } },
      });
      if (!listing) return errorText("unknown skill_id");
      const { outputSchema, successRate, reputation, _count, ...rest } = listing;
      return text({
        skill: {
          ...rest,
          ...describeReputation({ successRate, reputation }, _count.orders),
          output_fields: outputFieldNames(outputSchema),
        },
      });
    }
  );

  server.registerTool(
    "purchase_skill",
    {
      description:
        "Purchase a skill. Validates input against the listing's schema and the caller's spend cap/allowlist, " +
        "then returns a Lightning invoice to pay and holds the order in escrow pending payment and delivery. " +
        "'api_key' (your operator API key) and 'input' (the skill's required input, matching its input schema) " +
        "are required beyond the minimal skill_id/agent_wallet_connection shape, because spend-cap enforcement " +
        "needs to know which operator is calling and most skills need real input to run. " +
        "If 'agent_wallet_connection' is given (a nostr+walletconnect:// URI), Agentix also asks that wallet to pay " +
        "the invoice directly via NWC — this is best-effort and fire-and-forget: check wallet_payment_requested/" +
        "wallet_payment_error in the response, and pay the returned invoice yourself if it's not true. Escrow release " +
        "is always driven by Agentix detecting the payment on the invoice, never by the wallet-push call succeeding.",
      inputSchema: {
        skill_id: z.string(),
        input: z.record(z.string(), z.unknown()).describe("Input matching the skill's input JSON Schema"),
        api_key: z.string().describe("Your operator API key"),
        agent_wallet_connection: z
          .string()
          .optional()
          .describe("Optional nostr+walletconnect:// URI — if given, Agentix asks this wallet to pay the invoice"),
      },
    },
    async ({ skill_id, input, api_key, agent_wallet_connection }) => {
      try {
        const result = await createOrder(api_key, skill_id, input, agent_wallet_connection);
        return text(result);
      } catch (err) {
        if (err instanceof MarketplaceError) return errorText(err.message);
        return errorText("order creation failed");
      }
    }
  );

  server.registerTool(
    "check_order_status",
    {
      description:
        "Poll an order's status. Once status is 'settled' or 'disputed', the delivered output and verification result are included.",
      inputSchema: { order_id: z.string() },
    },
    async ({ order_id }) => {
      try {
        const order = await getOrderStatus(order_id);
        return text({ order });
      } catch (err) {
        if (err instanceof MarketplaceError) return errorText(err.message);
        return errorText("could not check order status");
      }
    }
  );

  server.registerTool(
    "submit_skill",
    {
      description:
        "Submit a new skill listing for sale. NOT YET AVAILABLE — the seller-listing flow isn't live on Agentix yet. " +
        "Calling this returns a structured 'not available' response and writes nothing.",
      inputSchema: {
        name: z.string().optional(),
        description: z.string().optional(),
        price_sats: z.number().optional(),
        input_schema: z.record(z.string(), z.unknown()).optional(),
        output_schema: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async () => {
      return errorText(
        "submit_skill is not available yet — the seller-listing flow hasn't shipped on Agentix. " +
          "Check back later, or watch https://shop.agentixshop.com for seller onboarding."
      );
    }
  );

  server.registerResource(
    "catalog",
    "agentix://catalog",
    {
      title: "Agentix skill catalog",
      description: "The full current catalog of active skill listings on Agentix.",
      mimeType: "application/json",
    },
    async (uri) => {
      const listings = await searchListings({});
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                skills: listings.map((l) => ({
                  id: l.id,
                  name: l.name,
                  description: l.description,
                  price_sats: l.priceSats,
                  reputation: l.reputation,
                  success_rate: l.success_rate,
                  reputation_status: l.reputation_status,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  return server;
}
