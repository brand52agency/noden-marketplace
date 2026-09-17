"use client";

import { useCurrency } from "@/lib/currency-context";
import { satsToUsd } from "@/lib/btc-price";

export default function Amount({
  sats,
  usdPerBtc,
  className,
}: {
  sats: number;
  usdPerBtc: number;
  className?: string;
}) {
  const { unit } = useCurrency();

  if (unit === "usd") {
    const usd = satsToUsd(sats, usdPerBtc);
    return <span className={className}>${usd < 0.01 ? usd.toFixed(4) : usd.toFixed(2)}</span>;
  }
  return <span className={className}>{sats.toLocaleString()} sats</span>;
}
