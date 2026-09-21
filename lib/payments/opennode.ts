import { PaymentRail, PaymentRequest, PaymentStatus } from "./types";
import { looksLikeLightningAddress, resolveLightningAddress } from "./lnurl";

// OPENNODE_ENV defaults to "dev" on purpose — the dev environment uses
// fake sats against dev-api.opennode.co, so a missing/unset env var
// can't accidentally start moving real money. Set OPENNODE_ENV=production
// only once you're deliberately ready to.
const OPENNODE_ENV = process.env.OPENNODE_ENV === "production" ? "production" : "dev";
const OPENNODE_API_KEY = process.env.OPENNODE_API_KEY;
const OPENNODE_BASE_URL = OPENNODE_ENV === "production" ? "https://api.opennode.com" : "https://dev-api.opennode.co";

export const OPENNODE_CONFIGURED = Boolean(OPENNODE_API_KEY);

function requireConfig() {
  if (!OPENNODE_CONFIGURED) {
    throw new Error(
      "OpenNode isn't configured — set OPENNODE_API_KEY in .env. Get a free dev-environment key at https://dev.opennode.co."
    );
  }
}

async function opennodeFetch(path: string, init: RequestInit) {
  const res = await fetch(`${OPENNODE_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: OPENNODE_API_KEY as string,
      ...init.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`OpenNode ${path} failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body.data;
}

function mapStatus(status: string): PaymentStatus {
  switch (status) {
    case "paid":
      return "paid";
    case "expired":
      return "expired";
    case "unpaid":
    case "processing":
      return "pending";
    default:
      // underpaid, refunded, failed — none of these mean "still waiting to be paid"
      return "failed";
  }
}

export const opennodeRail: PaymentRail = {
  name: "opennode",
  get configured() {
    return OPENNODE_CONFIGURED;
  },

  async createPaymentRequest(amountSats, metadata): Promise<PaymentRequest> {
    requireConfig();
    const description = typeof metadata.memo === "string" ? metadata.memo : "Agentix order";
    const data = await opennodeFetch("/v1/charges", {
      method: "POST",
      body: JSON.stringify({ amount: amountSats, description, ttl: 15 }),
    });
    return {
      id: data.id,
      amountSats,
      railInvoiceRef: data.lightning_invoice.payreq,
      expiresAt: new Date(data.lightning_invoice.expires_at * 1000).toISOString(),
      status: mapStatus(data.status),
    };
  },

  async checkStatus(paymentRequestId): Promise<PaymentStatus> {
    requireConfig();
    try {
      const data = await opennodeFetch(`/v2/charge/${paymentRequestId}`, { method: "GET" });
      return mapStatus(data.status);
    } catch {
      return "failed";
    }
  },

  async payOut(destination, amountSats, memo) {
    requireConfig();
    const bolt11 = looksLikeLightningAddress(destination)
      ? await resolveLightningAddress(destination, amountSats)
      : destination;
    await opennodeFetch("/v2/withdrawals", {
      method: "POST",
      body: JSON.stringify({ type: "ln", address: bolt11, amount: amountSats }),
    });
    void memo;
  },
};
