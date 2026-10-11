import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";
import { APP_URL, sendEmail } from "@/lib/email";
import { isDisposableEmail, normalizeEmail } from "@/lib/email-policy";

const TOKEN_TTL_HOURS = 24;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_DAY = 5;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// Sends (or re-sends) a verification link. Returns a reason when it declines.
export async function sendVerificationEmail(
  operatorId: string
): Promise<{ sent: true } | { sent: false; reason: "already_verified" | "too_soon" | "daily_limit" | "send_failed" | "not_found" }> {
  const operator = await db.operator.findUnique({ where: { id: operatorId } });
  if (!operator) return { sent: false, reason: "not_found" };
  if (operator.emailVerifiedAt) return { sent: false, reason: "already_verified" };

  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const recent = await db.emailVerificationToken.findMany({
    where: { operatorId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recent.length >= MAX_SENDS_PER_DAY) return { sent: false, reason: "daily_limit" };
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    return { sent: false, reason: "too_soon" };
  }

  const token = randomBytes(32).toString("hex");
  await db.emailVerificationToken.create({
    data: { operatorId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000) },
  });

  const link = `${APP_URL}/verify-email?token=${token}`;
  const ok = await sendEmail(
    operator.email,
    "Confirm your email for Noden",
    `Confirm your email to unlock your free first call on Noden:\n\n${link}\n\n` +
      `The link works once and expires in ${TOKEN_TTL_HOURS} hours. If you didn't sign up, ignore this email.`
  );
  return ok ? { sent: true } : { sent: false, reason: "send_failed" };
}

export type VerifyResult =
  | { status: "verified"; trialGranted: boolean }
  | { status: "already_verified" }
  | { status: "invalid" };

// Marks the email verified and, if this normalized address has never claimed one,
// grants the single free trial. The TrialClaim primary key makes "one per address"
// a database guarantee, even under concurrent requests.
export async function verifyEmailToken(token: string): Promise<VerifyResult> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { status: "invalid" };
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash: sha256(token) },
    include: { operator: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    // A reused link for an account that is already verified is not an error.
    if (record?.operator.emailVerifiedAt) return { status: "already_verified" };
    return { status: "invalid" };
  }
  const operator = record.operator;
  if (operator.emailVerifiedAt) return { status: "already_verified" };

  const eligible = !isDisposableEmail(operator.email) && !operator.email.endsWith("@example.invalid");

  return db.$transaction(async (tx) => {
    const marked = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (marked.count !== 1) return { status: "invalid" as const }; // lost a race with another click

    let trialGranted = false;
    if (eligible) {
      try {
        await tx.trialClaim.create({ data: { normalizedEmail: normalizeEmail(operator.email), operatorId: operator.id } });
        trialGranted = true;
      } catch (err) {
        // P2002 = unique violation: this address already claimed its trial.
        if (!(err && typeof err === "object" && "code" in err && err.code === "P2002")) throw err;
        // A failed statement aborts a Postgres transaction, so signal the caller to retry without the claim.
        throw new AlreadyClaimed();
      }
    }
    await tx.operator.update({
      where: { id: operator.id },
      data: { emailVerifiedAt: new Date(), ...(trialGranted ? { trialCallsRemaining: 1 } : {}) },
    });
    return { status: "verified" as const, trialGranted };
  }).catch(async (err) => {
    if (!(err instanceof AlreadyClaimed)) throw err;
    // Verify without a trial in a fresh transaction.
    await db.emailVerificationToken.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: new Date() } });
    await db.operator.update({ where: { id: operator.id }, data: { emailVerifiedAt: new Date() } });
    return { status: "verified" as const, trialGranted: false };
  });
}

class AlreadyClaimed extends Error {}
