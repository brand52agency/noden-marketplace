"use client";

import { useState } from "react";
import { satsToUsd } from "@/lib/btc-price";

export default function SatsPrice({
  sats,
  usdPerBtc,
  className,
}: {
  sats: number;
  usdPerBtc: number;
  className?: string;
}) {
  const [showUsd, setShowUsd] = useState(false);
  const usd = satsToUsd(sats, usdPerBtc);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowUsd((v) => !v);
      }}
      title="Click to toggle sats / USD"
      className={className ?? "font-mono text-accent"}
    >
      {showUsd
        ? `$${usd < 0.01 ? usd.toFixed(4) : usd.toFixed(2)}`
        : `${sats.toLocaleString()} sats`}
    </button>
  );
}
