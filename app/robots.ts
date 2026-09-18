import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/marketplace", "/api/v1/", "/mcp", "/operator", "/llms.txt", "/openapi.json"],
        disallow: ["/admin", "/api/auth", "/operator/dashboard", "/operator/setup", "/operator/audit-log"],
      },
      // Explicitly welcome known AI/agent crawlers — this marketplace exists
      // for agents to find and use, not just humans via a search engine.
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
    ],
    sitemap: "https://shop.agentixshop.com/sitemap.xml",
  };
}
