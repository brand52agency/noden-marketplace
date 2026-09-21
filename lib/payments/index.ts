import { lnbitsRail } from "./lnbits";
import { albyRail } from "./alby";
import { PaymentRail } from "./types";

const ACTIVE_PAYMENT_RAIL = "alby-nwc";

const rails: Record<string, PaymentRail> = {
  "lightning-l402": lnbitsRail,
  "alby-nwc": albyRail,
};

export const paymentRail: PaymentRail = rails[ACTIVE_PAYMENT_RAIL];

export * from "./types";