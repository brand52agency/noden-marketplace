import Link from "next/link";

export type MarketplaceView = "agent" | "operator";

function buildHref(view: MarketplaceView, q?: string, category?: string) {
  const params = new URLSearchParams();
  if (view === "operator") params.set("view", "operator");
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default function ViewToggle({
  view,
  q,
  category,
}: {
  view: MarketplaceView;
  q?: string;
  category?: string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs">
      {(
        [
          { key: "agent" as const, label: "Agent" },
          { key: "operator" as const, label: "Agent Operator" },
        ]
      ).map((opt) => (
        <Link
          key={opt.key}
          href={buildHref(opt.key, q, category)}
          className={`rounded-full px-4 py-2 font-medium transition-colors ${
            view === opt.key ? "bg-ink text-bg" : "text-ink-secondary hover:text-ink"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
