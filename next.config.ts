import type { NextConfig } from "next";

// Clients that send `Accept: text/markdown` get a markdown rendering of the
// page instead of HTML. Plain `.md` URLs work too, for tools that can't set
// headers.
const ACCEPTS_MARKDOWN = [{ type: "header" as const, key: "accept", value: ".*text/markdown.*" }];

const DISCOVERY_LINKS = [
  '</llms.txt>; rel="describedby"; type="text/plain"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
  '</.well-known/agent-card.json>; rel="describedby"; type="application/json"',
].join(", ");

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/marketplace/:id.md", destination: "/md/listing/:id" },
        { source: "/marketplace/:id", has: ACCEPTS_MARKDOWN, destination: "/md/listing/:id" },
        { source: "/catalog.md", destination: "/md/catalog" },
        { source: "/", has: ACCEPTS_MARKDOWN, destination: "/md/catalog" },
        // Earlier A2A drafts served the agent card at agent.json.
        { source: "/.well-known/agent.json", destination: "/.well-known/agent-card.json" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      { source: "/", headers: [{ key: "Link", value: DISCOVERY_LINKS }, { key: "Vary", value: "Accept" }] },
      { source: "/marketplace/:id", headers: [{ key: "Vary", value: "Accept" }] },
    ];
  },
};

export default nextConfig;
