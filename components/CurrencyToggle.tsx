"use client";

import { useCurrency } from "@/lib/currency-context";

export default function CurrencyToggle() {
  const { unit, setUnit } = useCurrency();

  return (
    <div className="flex items-center rounded-full border border-border bg-surface p-0.5 text-xs">
      {(["sats", "usd"] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => setUnit(u)}
          className={`rounded-full px-3 py-1 uppercase transition-colors ${
            unit === u ? "bg-ink text-bg" : "text-ink-secondary hover:text-ink"
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}
