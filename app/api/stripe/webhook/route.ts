import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, webhookSecret, BillingNotConfigured } from "@/lib/billing/stripe";
import { expireCheckoutSession, fulfilCheckoutSession, handleDispute, handleRefund } from "@/lib/billing/fulfil";

// Stripe calls this; the signature check is the only authentication, so it runs before anything else
// and uses the raw request text (a parsed body would not match the signature).
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, webhookSecret());
  } catch (err) {
    if (err instanceof BillingNotConfigured) return NextResponse.json({ error: "billing is not configured" }, { status: 503 });
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await fulfilCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
        await expireCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "charge.refunded":
        await handleRefund(event.data.object as Stripe.Charge);
        break;
      case "charge.dispute.created":
        await handleDispute(event.data.object as Stripe.Dispute);
        break;
      default:
        break; // every other event is acknowledged and ignored
    }
  } catch (err) {
    // A 500 makes Stripe retry later; the ledger is idempotent, so a retry is safe.
    console.error(`stripe webhook ${event.type} ${event.id} failed:`, err);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
