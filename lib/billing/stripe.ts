import Stripe from "stripe";

let client: Stripe | null = null;

export class BillingNotConfigured extends Error {}

// The secret key is a restricted key kept in Vercel (STRIPE_SECRET_KEY); it is never in the repo.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new BillingNotConfigured("Stripe is not configured");
  client ??= new Stripe(key);
  return client;
}

export const isTestMode = () => /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY ?? "");

export function webhookSecret(): string {
  const s = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s) throw new BillingNotConfigured("STRIPE_WEBHOOK_SECRET is not set");
  return s;
}

// Where Stripe sends buyers back to. In production this is always the real shop address (NEXTAUTH_URL may
// still hold an old domain); locally it follows NEXTAUTH_URL so test purchases return to localhost.
export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.NODE_ENV === "production" ? "https://shop.getnoden.com" : (process.env.NEXTAUTH_URL ?? "http://localhost:3200"))).replace(/\/$/, "");
