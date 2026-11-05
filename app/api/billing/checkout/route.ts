import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { billingEnabled, getSku } from "@/lib/billing/catalog";
import { getStripe, isTestMode, siteUrl } from "@/lib/billing/stripe";

// Starts a Stripe Checkout for one credit pack. The price comes from lib/billing/catalog.ts, never from the form.
export async function POST(request: NextRequest) {
  const back = (code: string) => NextResponse.redirect(new URL(`/operator/credits?error=${code}`, siteUrl()), 303);

  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login?from=/operator/credits", siteUrl()), 303);
  if (!billingEnabled()) return back("unavailable");

  const form = await request.formData();
  const sku = getSku(String(form.get("sku") ?? ""));
  if (!sku) return back("bad_sku");

  const operator = await db.operator.findUnique({ where: { id: session.user.id } });
  if (!operator) return back("unavailable");
  // In Stripe test mode, only admin accounts can start a checkout (see the matching guard in lib/billing/fulfil.ts).
  if (isTestMode() && operator.role !== "admin") return back("unavailable");
  if (!operator.emailVerifiedAt) return back("verify_email");
  if (operator.billingHoldAt) return back("hold");

  // Card-testing defence: a few checkout starts per account per hour, and per day.
  const hourly = await rateLimit(`checkout:${operator.id}`, 6, 3600);
  const daily = hourly.ok ? await rateLimit(`checkout-day:${operator.id}`, 20, 86_400) : hourly;
  if (!hourly.ok || !daily.ok) return back("slow_down");

  let checkout;
  try {
    const base = siteUrl();
    checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: operator.id,
      ...(operator.stripeCustomerId ? { customer: operator.stripeCustomerId } : { customer_email: operator.email }),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: sku.amountCents,
            product_data: { name: `Noden ${sku.label}`, description: "Prepaid credits for the Noden skill marketplace. Credits don't expire.", metadata: { app: "noden", sku: sku.id } },
          },
        },
      ],
      metadata: { app: "noden", operator_id: operator.id, sku: sku.id },
      payment_intent_data: {
        description: `Noden ${sku.label}`,
        statement_descriptor_suffix: "NODEN",
        metadata: { app: "noden", operator_id: operator.id, sku: sku.id },
      },
      ...(process.env.STRIPE_AUTOMATIC_TAX === "true" ? { automatic_tax: { enabled: true } } : {}),
      success_url: `${base}/operator/credits?purchase=success`,
      cancel_url: `${base}/operator/credits?purchase=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    await db.purchase.create({
      data: { operatorId: operator.id, sku: sku.id, credits: sku.credits, amountCents: sku.amountCents, stripeSessionId: checkout.id },
    });
  } catch (err) {
    console.error("checkout start failed:", err);
    return back("unavailable");
  }
  if (!checkout.url) return back("unavailable");
  return NextResponse.redirect(checkout.url, 303);
}
