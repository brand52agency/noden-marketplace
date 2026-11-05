// What can be bought with a card. Keep the credit/price pairs in step with TOP_UPS in the marketing
// repo's lib/plans.ts. Prices are in US cents; the Checkout Session is built from this table (never
// from anything the browser sends), so a buyer can only ever pick a SKU, not a price.
export type Sku = { id: string; credits: number; amountCents: number; label: string };

export const SKUS: Sku[] = [
  { id: "topup-1000", credits: 1_000, amountCents: 1_200, label: "1,000 credits" },
  { id: "topup-5000", credits: 5_000, amountCents: 5_500, label: "5,000 credits" },
  { id: "topup-12000", credits: 12_000, amountCents: 12_000, label: "12,000 credits" },
];

export const getSku = (id: string) => SKUS.find((s) => s.id === id) ?? null;

export const formatUsd = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

// Card payments are off until BILLING_ENABLED=true AND a Stripe key is set (both live in Vercel, never in the repo).
export const billingEnabled = () => process.env.BILLING_ENABLED === "true" && Boolean(process.env.STRIPE_SECRET_KEY);

// New buyers can spend at most this many credits per rolling 24 hours for their first 7 days after
// their first paid purchase. Slows down anyone spending stolen-card credits before the card is reported.
export const NEW_BUYER_DAILY_CREDIT_LIMIT = Number(process.env.NEW_BUYER_DAILY_CREDIT_LIMIT ?? 1_000);
export const NEW_BUYER_WINDOW_DAYS = 7;
