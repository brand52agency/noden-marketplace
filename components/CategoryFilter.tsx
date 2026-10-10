"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

// Multi-select category filter. Selection travels in the URL as one
// comma-separated `category` param, so every other control that already
// preserves `category` (sort, layout, persona, search) keeps working as-is.
export function CategoryFilter({
  categories,
  selected,
  baseParams,
}: {
  categories: string[];
  selected: string[];
  baseParams: Record<string, string>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedKey = selected.join(",");

  // Reset the draft when the URL selection changes (adjusting state during
  // render rather than in an effect, per the React docs).
  const [syncedKey, setSyncedKey] = useState(selectedKey);
  if (syncedKey !== selectedKey) {
    setSyncedKey(selectedKey);
    setDraft(selectedKey ? selectedKey.split(",") : []);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function hrefFor(cats: string[]) {
    const params = new URLSearchParams(baseParams);
    if (cats.length) params.set("category", cats.join(","));
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  function toggle(c: string) {
    setDraft((d) => (d.includes(c) ? d.filter((x) => x !== c) : [...d, c]));
  }

  function apply() {
    setOpen(false);
    router.push(hrefFor(draft));
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-ink transition-colors hover:border-ink-tertiary"
        >
          Categories
          {selected.length > 0 && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] text-bg">{selected.length}</span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute left-0 z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <ul role="listbox" aria-multiselectable="true" className="max-h-72 overflow-y-auto p-2">
              {categories.map((c) => {
                const on = draft.includes(c);
                return (
                  <li key={c} role="option" aria-selected={on}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-raised">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(c)}
                        className="h-4 w-4 shrink-0 accent-[#ee6833]"
                      />
                      {c}
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <button
                type="button"
                onClick={() => setDraft([])}
                className="text-xs text-ink-secondary transition-colors hover:text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={apply}
                className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-bg transition-opacity hover:opacity-90"
              >
                {draft.length ? `Show ${draft.length} ${draft.length === 1 ? "category" : "categories"}` : "Show all"}
              </button>
            </div>
          </div>
        )}
      </div>

      {selected.map((c) => (
        <Link
          key={c}
          href={hrefFor(selected.filter((x) => x !== c))}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs text-bg transition-opacity hover:opacity-90"
          aria-label={`Remove ${c} filter`}
        >
          {c}
          <X className="h-3 w-3" />
        </Link>
      ))}
      {selected.length > 1 && (
        <Link href={hrefFor([])} className="text-xs text-ink-secondary transition-colors hover:text-ink">
          Clear all
        </Link>
      )}
    </div>
  );
}
