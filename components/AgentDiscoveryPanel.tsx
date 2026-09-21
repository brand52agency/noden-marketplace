import Link from "next/link";

const lines = [
  { label: "REST", value: "GET /api/v1/listings" },
  { label: "REST", value: "POST /api/v1/orders" },
  { label: "MCP", value: "search_skills" },
  { label: "MCP", value: "purchase_skill" },
];

export function AgentDiscoveryPanel() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">agent discovery</p>
      <p className="mt-2 text-sm text-ink-secondary">
        This page is a mirror. Everything here is reachable programmatically, live.
      </p>

      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border bg-bg p-4">
        {lines.map((l) => (
          <div key={l.value} className="flex items-center gap-3 font-mono text-xs">
            <span className="w-10 shrink-0 text-ink-tertiary">{l.label}</span>
            <span className="truncate text-ink">{l.value}</span>
          </div>
        ))}
      </div>

      <Link href="/mcp" className="mt-4 inline-block text-xs text-accent hover:underline">
        View MCP server details →
      </Link>
    </div>
  );
}
