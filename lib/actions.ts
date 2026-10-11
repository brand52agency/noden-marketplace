"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, signIn, signOut } from "@/lib/auth";
import { REVOKED_KEY_FIELDS, apiKeyFields, generateApiKey } from "@/lib/api-key";
import { cookies, headers } from "next/headers";
import { limitByClient } from "@/lib/rate-limit";
import { issueRetryToken } from "@/lib/marketplace";
import { revalidatePath } from "next/cache";
import { isDisposableEmail } from "@/lib/email-policy";
import { sendVerificationEmail } from "@/lib/verification";

export type ActionState = { error?: string } | null;

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Cheap bot checks: a honeypot field people never see, and a form that cannot be submitted
  // within 2.5 seconds of being rendered. (A CAPTCHA needs third-party keys; add one if abuse continues.)
  const startedAt = Number(formData.get("formStartedAt") ?? 0);
  if (String(formData.get("company") ?? "") !== "" || !startedAt || Date.now() - startedAt < 2500) {
    return { error: "Something looks off with that submission. Wait a moment and try again." };
  }
  const blocked = await limitByClient("signup", await headers(), { perIp: 5, perNetwork: 20, windowSec: 3600 });
  if (blocked) {
    return { error: `Too many sign-ups from your network. Try again in ${Math.ceil(blocked.retryAfterSec / 60)} minute(s).` };
  }

  if (!email || !password || password.length < 8) {
    return { error: "Enter an email and a password of at least 8 characters." };
  }

  const existing = await db.operator.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  if (isDisposableEmail(email)) {
    return { error: "Please use a permanent email address — temporary inboxes aren't accepted." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newKey = generateApiKey();
  const operator = await db.operator.create({
    data: { email, passwordHash, role: "buyer", ...apiKeyFields(newKey) },
  });
  await showKeyOnce(newKey);
  // The free first call is granted when the email is confirmed, not at signup.
  await sendVerificationEmail(operator.id);

  await signIn("credentials", { email, password, redirectTo: "/operator/setup" });
  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/operator/dashboard" });
  } catch (err) {
    if (err && typeof err === "object" && "type" in err) {
      return { error: "Incorrect email or password." };
    }
    throw err;
  }
  return null;
}

export async function saveSetupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };

  const nwcConnection = String(formData.get("nwcConnection") ?? "").trim();
  const spendCapDailySats = Number(formData.get("spendCapDailySats") ?? 0);
  const allowAllSellers = formData.get("allowAllSellers") === "on";

  if (nwcConnection && !nwcConnection.startsWith("nostr+walletconnect://")) {
    return { error: "That doesn't look like an NWC connection string (should start with nostr+walletconnect://)." };
  }
  if (!Number.isFinite(spendCapDailySats) || spendCapDailySats < 0) {
    return { error: "Spend cap must be a positive number of sats." };
  }

  await db.operator.update({
    where: { id: session.user.id },
    data: { nwcConnection: nwcConnection || null, spendCapDailySats, allowAllSellers },
  });

  redirect("/operator/dashboard");
}

// The plaintext key is never stored, so it is handed to the owner exactly once: in a short-lived
// HttpOnly cookie that the next page shows and then clears (never in a URL).
const NEW_KEY_COOKIE = "noden_new_key";
async function showKeyOnce(key: string) {
  (await cookies()).set(NEW_KEY_COOKIE, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
}

export async function regenerateApiKeyAction() {
  const session = await auth();
  if (!session?.user?.id) return;
  const key = generateApiKey();
  // Writing the new hash replaces (and so revokes) the old key at the same moment.
  await db.operator.update({ where: { id: session.user.id }, data: { ...apiKeyFields(key), apiKey: null } });
  await showKeyOnce(key);
  redirect("/operator/dashboard");
}

export async function revokeApiKeyAction() {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.operator.update({ where: { id: session.user.id }, data: REVOKED_KEY_FIELDS });
  redirect("/operator/dashboard");
}

export async function adminIssueRetryAction(orderId: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") return;
  await issueRetryToken(orderId);
  revalidatePath(`/admin/transactions/${orderId}`);
}

export async function regenerateInsightsAction() {
  const session = await auth();
  if (session?.user?.role !== "admin") return;
  const { getInsights } = await import("@/lib/insights");
  await getInsights(true);
  revalidatePath("/admin/insights");
}

export async function resendVerificationAction(): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in." };
  const result = await sendVerificationEmail(session.user.id);
  if (result.sent) return null;
  const messages = {
    already_verified: "Your email is already confirmed.",
    too_soon: "A link was just sent — give it a minute, then check your inbox and spam folder.",
    daily_limit: "Too many verification emails today. Try again tomorrow.",
    send_failed: "We couldn't send the email right now. Try again in a few minutes.",
    not_found: "Account not found.",
  } as const;
  return { error: messages[result.reason] };
}
