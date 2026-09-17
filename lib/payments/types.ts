// Every payment flows through this interface. LNbitsRail (lnbits.ts)
// is the only implementation built for launch. Route handlers and the
// MCP/REST agent surfaces should only ever import { paymentRail } from
// "@/lib/payments" — never reference Lightning or LNbits directly, so
// swapping rails later (Voltage, a raw LND node, Breez SDK) touches
// one file.

export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

export type PaymentRequest = {
  id: string; // rail's payment hash — also Order.railPaymentHash
  amountSats: number;
  railInvoiceRef: string; // the bolt11 invoice string
  expiresAt: string;
  status: PaymentStatus;
};

export interface PaymentRail {
  readonly name: string;
  readonly configured: boolean;
  createPaymentRequest(amountSats: number, metadata: Record<string, unknown>): Promise<PaymentRequest>;
  checkStatus(paymentRequestId: string): Promise<PaymentStatus>;
  payOut(destination: string, amountSats: number, memo?: string): Promise<void>;
}
