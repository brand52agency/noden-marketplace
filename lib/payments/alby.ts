import { PaymentRail, PaymentRequest, PaymentStatus } from "./types";
import { looksLikeLightningAddress, resolveLightningAddress } from "./lnurl";
import { callNwcMethod } from "./nwc-rpc";

// Noden's OWN wallet, connected via NWC (e.g. an Alby Hub "app
// connection" string) rather than a hosted admin-key API like
// LNbits/OpenNode. See nwc-rpc.ts for why this needs a full request/
// response NWC client instead of the fire-and-forget push in nwc.ts.
const ALBY_NWC_URL = process.env.ALBY_NWC_URL;

export const ALBY_CONFIGURED = Boolean(ALBY_NWC_URL);

function requireConfig() {
  if (!ALBY_CONFIGURED) {
    throw new Error(
      "Alby Hub isn't configured — set ALBY_NWC_URL in .env to a nostr+walletconnect:// connection string " +
        "from an app connection in your Alby Hub."
    );
  }
}

function mapInvoiceState(state: unknown, settledAt: unknown): PaymentStatus {
  switch (state) {
    case "settled":
      return "paid";
    case "expired":
      return "expired";
    case "failed":
      return "failed";
    case "pending":
    case "accepted":
      return "pending";
    default:
      // Older/other implementations may omit `state` — fall back to
      // whether the invoice has a settlement timestamp.
      return settledAt ? "paid" : "pending";
  }
}

export const albyRail: PaymentRail = {
  name: "alby-nwc",
  get configured() {
    return ALBY_CONFIGURED;
  },

  async createPaymentRequest(amountSats, metadata): Promise<PaymentRequest> {
    requireConfig();
    const description = typeof metadata.memo === "string" ? metadata.memo : "Noden order";
    const response = await callNwcMethod(ALBY_NWC_URL as string, "make_invoice", {
      amount: amountSats * 1000, // NWC amounts are millisats
      description,
      expiry: 900,
    });
    if ("error" in response) {
      throw new Error(`Alby Hub make_invoice failed: ${response.error.message}`);
    }
    const result = response.result as { invoice: string; payment_hash: string; expires_at?: number };
    return {
      id: result.payment_hash,
      amountSats,
      railInvoiceRef: result.invoice,
      expiresAt: result.expires_at
        ? new Date(result.expires_at * 1000).toISOString()
        : new Date(Date.now() + 900_000).toISOString(),
      status: "pending",
    };
  },

  async checkStatus(paymentRequestId): Promise<PaymentStatus> {
    requireConfig();
    try {
      const response = await callNwcMethod(ALBY_NWC_URL as string, "lookup_invoice", {
        payment_hash: paymentRequestId,
      });
      if ("error" in response) return "failed";
      const result = response.result as { state?: string; settled_at?: number };
      return mapInvoiceState(result.state, result.settled_at);
    } catch {
      return "failed";
    }
  },

  async payOut(destination, amountSats, memo) {
    requireConfig();
    const bolt11 = looksLikeLightningAddress(destination)
      ? await resolveLightningAddress(destination, amountSats)
      : destination;
    // No `amount` param — the invoice (direct or LNURL-resolved) already
    // carries the amount; NWC's amount override is only for amountless ones.
    const response = await callNwcMethod(ALBY_NWC_URL as string, "pay_invoice", { invoice: bolt11 });
    if ("error" in response) {
      throw new Error(`Alby Hub pay_invoice failed: ${response.error.message}`);
    }
    void memo;
  },
};
