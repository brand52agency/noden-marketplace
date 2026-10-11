// Order lifecycle (NODEN_PRICING_TASKS.md A3b): pending -> completed | failed, plus refunded for
// reversals. Nothing is held between payment and result, so there are no intermediate states.
//
// Rows written before the change still carry the old values until scripts/migrate-order-states.ts
// has run, so every read goes through these helpers and accepts both spellings.
export type OrderStatus = "pending" | "completed" | "failed" | "refunded";

export const PENDING_VALUES = ["pending", "pending_payment", "paid", "delivered"] as const;
export const COMPLETED_VALUES = ["completed", "settled", "verified"] as const;
export const FAILED_VALUES = ["failed", "disputed"] as const;
export const REFUNDED_VALUES = ["refunded"] as const;
// Orders that reached a final outcome (what reputation is computed from).
export const FINISHED_VALUES = [...COMPLETED_VALUES, ...FAILED_VALUES, ...REFUNDED_VALUES] as const;

const has = (list: readonly string[], s: string) => list.includes(s);
export const isPending = (s: string) => has(PENDING_VALUES, s);
export const isCompleted = (s: string) => has(COMPLETED_VALUES, s);
export const isFailed = (s: string) => has(FAILED_VALUES, s);

export function normalizeOrderStatus(s: string): OrderStatus {
  if (isPending(s)) return "pending";
  if (isCompleted(s)) return "completed";
  if (isFailed(s)) return "failed";
  return "refunded";
}

// Free orders (a verified account's trial call, or a retry after a failed check) carry a marker
// instead of a Lightning payment hash.
export const TRIAL_HASH_PREFIX = "trial_";
export const RETRY_HASH_PREFIX = "retry_";
export const isFreeHash = (hash: string) => hash.startsWith(TRIAL_HASH_PREFIX) || hash.startsWith(RETRY_HASH_PREFIX);

// Every stored value that means the given status, old spellings included (for database filters).
export function valuesFor(status: string): string[] {
  switch (normalizeOrderStatus(status)) {
    case "pending": return [...PENDING_VALUES];
    case "completed": return [...COMPLETED_VALUES];
    case "failed": return [...FAILED_VALUES];
    default: return [...REFUNDED_VALUES];
  }
}
