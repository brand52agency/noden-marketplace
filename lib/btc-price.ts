const FALLBACK_USD_PER_BTC = 60000;

export async function getBtcUsdRate(): Promise<number> {
  try {
    const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return FALLBACK_USD_PER_BTC;
    const data = await res.json();
    const rate = Number(data?.data?.amount);
    return Number.isFinite(rate) && rate > 0 ? rate : FALLBACK_USD_PER_BTC;
  } catch {
    return FALLBACK_USD_PER_BTC;
  }
}

export function satsToUsd(sats: number, usdPerBtc: number): number {
  return (sats / 100_000_000) * usdPerBtc;
}
