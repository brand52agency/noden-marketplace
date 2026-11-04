import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getKit, isFreeKit } from "@/lib/kits";

// Adds a free kit to the signed-in account. Paid kits can't be claimed here: they are added by the Stripe webhook.
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const form = await request.formData();
  const kit = getKit(String(form.get("kit") ?? ""));
  if (!kit) return NextResponse.redirect(new URL("/kits", origin), 303);

  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL(`/login?from=${encodeURIComponent(`/kits/${kit.id}`)}`, origin), 303);
  if (!isFreeKit(kit)) return NextResponse.redirect(new URL(`/kits/${kit.id}`, origin), 303);

  const limited = await rateLimit(`kit-claim:${session.user.id}`, 20, 3600);
  if (!limited.ok) return NextResponse.redirect(new URL(`/kits/${kit.id}?error=slow_down`, origin), 303);

  await db.kitClaim.upsert({
    where: { operatorId_kitId: { operatorId: session.user.id, kitId: kit.id } },
    update: {},
    create: { operatorId: session.user.id, kitId: kit.id, source: "free" },
  });
  return NextResponse.redirect(new URL(`/operator/kits/${kit.id}?claimed=1`, origin), 303);
}
