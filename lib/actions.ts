"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, signIn, signOut } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-key";
import { refundOrder } from "@/lib/marketplace";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string } | null;

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password || password.length < 8) {
    return { error: "Enter an email and a password of at least 8 characters." };
  }

  const existing = await db.operator.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.operator.create({
    data: { email, passwordHash, role: "buyer", apiKey: generateApiKey() },
  });

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

export async function regenerateApiKeyAction() {
  const session = await auth();
  if (!session?.user?.id) return;
  await db.operator.update({ where: { id: session.user.id }, data: { apiKey: generateApiKey() } });
  redirect("/operator/dashboard");
}

export async function adminRefundAction(orderId: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") return;
  await refundOrder(orderId);
  revalidatePath(`/admin/transactions/${orderId}`);
  revalidatePath("/admin/transactions");
}

export async function regenerateInsightsAction() {
  const session = await auth();
  if (session?.user?.role !== "admin") return;
  const { getInsights } = await import("@/lib/insights");
  await getInsights(true);
  revalidatePath("/admin/insights");
}
