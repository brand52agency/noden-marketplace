import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/lib/mcp-server";

// Stateless MCP endpoint: fresh server+transport per request, matching
// how Next.js route handlers run (no long-lived process to hold a
// session across requests). Fine for stdio-less "tool call" usage;
// each of the four tools is independently idempotent-safe to retry.
async function handle(request: Request): Promise<Response> {
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export { handle as GET, handle as POST, handle as DELETE };
