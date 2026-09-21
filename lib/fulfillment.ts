import Anthropic from "@anthropic-ai/sdk";

// Real fulfillment: Claude actually performs the listing's task against the
// buyer's input, forced (via tool_choice) to return JSON conforming to the
// listing's outputSchema. Replaces the old hardcoded per-listing templates —
// those were structurally valid but never did the actual work.
export const FULFILLMENT_CONFIGURED = Boolean(process.env.ANTHROPIC_API_KEY);

type FulfillableListing = {
  name: string;
  description: string;
  details: string | null;
  outputSchema: unknown;
};

export async function fulfill(
  listing: FulfillableListing,
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (!FULFILLMENT_CONFIGURED) {
    throw new Error(
      "Fulfillment isn't configured — set ANTHROPIC_API_KEY in .env so purchased listings can actually be performed."
    );
  }

  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    system: [
      `You are the fulfillment engine behind the Noden marketplace listing "${listing.name}".`,
      listing.details ?? listing.description,
      "Given the buyer's input below, actually perform this task using only the information provided — don't ask clarifying questions, don't return placeholder or example values, don't explain what you would do. Produce the real, finished result via the return_result tool.",
      "If the task nominally needs live external data you have no way to know (a real-time rate, a live availability check, a real carrier quote), give the most reasonable, well-reasoned estimate you can from the input and general knowledge rather than refusing — a paying buyer needs a concrete answer, not a caveat.",
    ].join(" "),
    messages: [{ role: "user", content: `Input:\n${JSON.stringify(input, null, 2)}` }],
    tools: [
      {
        name: "return_result",
        description: `Return the completed result for "${listing.name}", matching the required schema exactly.`,
        input_schema: listing.outputSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "return_result" },
  });

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!toolUse) {
    throw new Error("fulfillment model returned no structured result");
  }
  return toolUse.input as Record<string, unknown>;
}
