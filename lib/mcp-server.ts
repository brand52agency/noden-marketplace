import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchListings } from "@/lib/search";
import { db } from "@/lib/db";
import { createOrder, getOrderStatus, MarketplaceError } from "@/lib/marketplace";
import { outputFieldNames } from "@/lib/schema-preview";

function text(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorText(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true };
}

export function createMcpServer() {
  const server = new McpServer({ name: "agentixshop", version: "1.0.0" });

  server.registerTool(
    "search_listings",
    {
      description:
        "Search Agentix listings by capability. Hybrid keyword/category match (semantic search when configured).",
      inputSchema: {
        query: z.string().optional().describe("Free-text capability description, e.g. 'reviews contracts'"),
        category: z.string().optional(),
        max_price_sats: z.number().optional(),
      },
    },
    async ({ query, category, max_price_sats }) => {
      const listings = await searchListings({ query, category, maxPriceSats: max_price_sats });
      return text({ listings });
    }
  );

  server.registerTool(
    "get_listing",
    {
      description:
        "Get full detail on one listing, including the exact input JSON Schema needed to purchase it. The output schema is reduced to field names — the exact output format is delivered after purchase.",
      inputSchema: { listing_id: z.string() },
    },
    async ({ listing_id }) => {
      const listing = await db.listing.findUnique({ where: { id: listing_id } });
      if (!listing) return errorText("unknown listing_id");
      const { outputSchema, ...rest } = listing;
      return text({ listing: { ...rest, output_fields: outputFieldNames(outputSchema) } });
    }
  );

  server.registerTool(
    "purchase",
    {
      description:
        "Purchase a listing. Validates input against the listing's schema and the caller's spend cap/allowlist, then returns a Lightning invoice to pay.",
      inputSchema: {
        listing_id: z.string(),
        input: z.record(z.string(), z.unknown()),
        api_key: z.string().describe("Your operator API key"),
      },
    },
    async ({ listing_id, input, api_key }) => {
      try {
        const result = await createOrder(api_key, listing_id, input);
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

  return server;
}
