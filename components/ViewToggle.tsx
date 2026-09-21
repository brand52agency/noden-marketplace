import Link from "next/link";

export type MarketplaceView = "agent" | "operator";

function buildHref(
  view: MarketplaceView,
  opts: { q?: string; category?: string; layout?: string; sort?: string }
) {
  const params = new URLSearchParams();
  if (view === "operator") params.set("view", "operator");
  if (opts.q) params.set("q", opts.q);
  if (opts.category) params.set("category", opts.category);
  if (opts.layout === "cards") params.set("layout", opts.layout);
  if (opts.sort) params.set("sort", opts.sort);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default function ViewToggle({
  view,
  q,
  category,
  layout,
  sort,
}: {
  view: MarketplaceView;
  q?: string;
  category?: string;
  layout?: string;
  sort?: string;
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
          href={buildHref(opt.key, { q, category, layout, sort })}
          className={`rounded-full px-4 py-2 font-medium transition-colors ${
            view === opt.key ? "bg-accent text-bg" : "text-ink-secondary hover:text-ink"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
