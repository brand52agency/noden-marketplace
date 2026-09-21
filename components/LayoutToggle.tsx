import Link from "next/link";

export type MarketplaceLayout = "table" | "cards";

function buildHref(
  layout: MarketplaceLayout,
  opts: { view?: string; q?: string; category?: string; sort?: string }
) {
  const params = new URLSearchParams();
  if (layout === "cards") params.set("layout", "cards");
  if (opts.view === "operator") params.set("view", opts.view);
  if (opts.q) params.set("q", opts.q);
  if (opts.category) params.set("category", opts.category);
  if (opts.sort) params.set("sort", opts.sort);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export default function LayoutToggle({
  layout,
  view,
  q,
  category,
  sort,
}: {
  layout: MarketplaceLayout;
  view?: string;
  q?: string;
  category?: string;
  sort?: string;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs">
      {(
        [
          { key: "table" as const, label: "Table" },
          { key: "cards" as const, label: "Cards" },
        ]
      ).map((opt) => (
        <Link
          key={opt.key}
          href={buildHref(opt.key, { view, q, category, sort })}
          className={`rounded-full px-4 py-2 font-medium transition-colors ${
            layout === opt.key ? "bg-accent text-bg" : "text-ink-secondary hover:text-ink"
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
