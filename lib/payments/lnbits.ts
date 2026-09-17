import { PaymentRail, PaymentRequest, PaymentStatus } from "./types";
import { looksLikeLightningAddress, resolveLightningAddress } from "./lnurl";

const LNBITS_URL = process.env.LNBITS_URL?.replace(/\/$/, "");
const LNBITS_ADMIN_KEY = process.env.LNBITS_ADMIN_KEY;

export const LNBITS_CONFIGURED = Boolean(LNBITS_URL && LNBITS_ADMIN_KEY);

function requireConfig() {
  if (!LNBITS_CONFIGURED) {
    throw new Error(
      "LNbits isn't configured — set LNBITS_URL and LNBITS_ADMIN_KEY in .env. Get a free hosted wallet at https://legend.lnbits.com."
    );
  }
}

async function lnbitsFetch(path: string, init: RequestInit) {
  const res = await fetch(`${LNBITS_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": LNBITS_ADMIN_KEY as string,
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LNbits ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

export const lnbitsRail: PaymentRail = {
  name: "lightning-l402",
  get configured() {
    return LNBITS_CONFIGURED;
  },

  async createPaymentRequest(amountSats, metadata): Promise<PaymentRequest> {
    requireConfig();
    const memo = typeof metadata.memo === "string" ? metadata.memo : "Agentix order";
    const data = await lnbitsFetch("/api/v1/payments", {
      method: "POST",
      body: JSON.stringify({ out: false, amount: amountSats, memo, expiry: 900 }),
    });
    return {
      id: data.payment_hash,
      amountSats,
      railInvoiceRef: data.payment_request,
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      status: "pending",
    };
  },

  async checkStatus(paymentRequestId): Promise<PaymentStatus> {
    requireConfig();
    try {
      const data = await lnbitsFetch(`/api/v1/payments/${paymentRequestId}`, { method: "GET" });
      return data.paid ? "paid" : "pending";
    } catch {
      return "failed";
    }
  },

  async payOut(destination, amountSats, memo) {
    requireConfig();
    const bolt11 = looksLikeLightningAddress(destination)
      ? await resolveLightningAddress(destination, amountSats)
      : destination;
    await lnbitsFetch("/api/v1/payments", {
      method: "POST",
      body: JSON.stringify({ out: true, bolt11 }),
    });
    void memo;
  },
};
