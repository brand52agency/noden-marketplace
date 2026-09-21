import Link from "next/link";

const SORTS: { key: string; label: string }[] = [
  { key: "reputation", label: "Top rated" },
  { key: "trades", label: "Most traded" },
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price ↑" },
];

export function SortMenu({
  sort,
  view,
  q,
  category,
  layout,
}: {
  sort: string;
  view?: string;
  q?: string;
  category?: string;
  layout?: string;
}) {
  function href(key: string) {
    const params = new URLSearchParams();
    if (view === "operator") params.set("view", view);
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (layout === "cards") params.set("layout", layout);
    if (key !== "reputation") params.set("sort", key);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-tertiary">sort</span>
      {SORTS.map((s) => (
        <Link
          key={s.key}
          href={href(s.key)}
          className={`rounded-full px-3 py-1 text-xs transition-colors ${
            sort === s.key ? "bg-accent text-bg" : "bg-surface-raised text-ink-secondary hover:text-ink"
          }`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
