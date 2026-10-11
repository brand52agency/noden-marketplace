// Failed calls are free to the buyer (they earn a retry token) but not to Noden, so a key that keeps
// failing is paused. The pause needs no stored state: it is simply "too many failures in the last
// hour", and lifts by itself as they age out.
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { FAILED_VALUES } from "@/lib/order-status";

export const FAILED_CALLS_PER_HOUR = Number(process.env.FAILED_CALLS_PER_HOUR ?? 5);
const HOUR_MS = 3600 * 1000;

export type PauseStatus = { paused: false } | { paused: true; failures: number; resumesInMinutes: number };

export async function keyPauseStatus(operatorId: string): Promise<PauseStatus> {
  const since = new Date(Date.now() - HOUR_MS);
  const failures = await db.order.findMany({
    where: { buyerId: operatorId, status: { in: [...FAILED_VALUES] }, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  if (failures.length < FAILED_CALLS_PER_HOUR) return { paused: false };
  // Resumes once enough of the oldest failures are an hour old that the count drops below the limit.
  const pivot = failures[failures.length - FAILED_CALLS_PER_HOUR];
  const resumesInMinutes = Math.max(1, Math.ceil((pivot.createdAt.getTime() + HOUR_MS - Date.now()) / 60000));
  return { paused: true, failures: failures.length, resumesInMinutes };
}

// Tells the owner once per pause window (the audit log doubles as the "already told them" record).
export async function notifyKeyPaused(operator: { id: string; email: string }, status: Extract<PauseStatus, { paused: true }>) {
  const recent = await db.auditLogEntry.findFirst({
    where: { operatorId: operator.id, action: "key_paused", createdAt: { gte: new Date(Date.now() - HOUR_MS) } },
    select: { id: true },
  });
  if (recent) return;
  await logAction(operator.id, "key_paused", { failures: status.failures, resumesInMinutes: status.resumesInMinutes });
  // Self-issued keys have no human attached; only real addresses get an email.
  if (operator.email.endsWith("@example.invalid")) return;
  await sendEmail(
    operator.email,
    "Your Noden API key is paused",
    `Your API key made ${status.failures} calls that failed their check in the last hour, so it is paused. ` +
      `It resumes automatically in about ${status.resumesInMinutes} minute(s).\n\n` +
      "Failed calls cost us compute even though they are free to retry. Check that your inputs match the listing's input schema.\n\n" +
      "If you didn't expect this, someone else may be using your key: regenerate it from your dashboard at https://shop.getnoden.com/operator/dashboard."
  );
}
