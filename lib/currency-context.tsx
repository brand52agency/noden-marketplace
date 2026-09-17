"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Unit = "sats" | "usd";

const CurrencyContext = createContext<{ unit: Unit; setUnit: (u: Unit) => void } | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<Unit>("sats");
  return <CurrencyContext.Provider value={{ unit, setUnit }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
