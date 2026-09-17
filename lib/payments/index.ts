import { lnbitsRail } from "./lnbits";
import { PaymentRail } from "./types";

// Single config value controls which rail is active. Nothing outside
// this folder should import lnbits.ts directly.
const ACTIVE_PAYMENT_RAIL = "lightning-l402";

const rails: Record<string, PaymentRail> = {
  "lightning-l402": lnbitsRail,
};

export const paymentRail: PaymentRail = rails[ACTIVE_PAYMENT_RAIL];

export * from "./types";
