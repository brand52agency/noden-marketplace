// A listing's price: credits first, sats second. Credits are what paid plans spend (1 credit =
// $0.01 of marketplace spend); sats are what a per-call Lightning purchase costs today.
export function ListingPrice({
  credits,
  sats,
  size = "sm",
  className = "",
}: {
  credits: number;
  sats: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const big = size === "lg";
  return (
    <span className={`inline-flex flex-col leading-tight ${className}`}>
      <span className={`font-mono text-accent ${big ? "text-2xl font-semibold" : "text-xs font-medium"}`}>
        {credits.toLocaleString()} credits
      </span>
      <span className={`font-mono text-ink-tertiary ${big ? "mt-1 text-xs" : "text-[10px]"}`}>
        {sats.toLocaleString()} sats
      </span>
    </span>
  );
}
