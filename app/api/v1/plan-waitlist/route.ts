import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Paid plans aren't open yet: getnoden.com/pricing posts here to join a waitlist.
// Submissions are stored as SellerLead rows (source "pricing-waitlist") so no schema
// change is needed, and a notification goes to the same inbox as other leads.
const NOTIFY_EMAIL = "getnoden@proton.me";
const SOURCE = "pricing-waitlist";
const PLANS: Record<string, string> = { starter: "Starter", builder: "Builder", pro: "Pro" };
const INTERVALS = new Set(["monthly", "annual"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ORIGINS = new Set(["https://getnoden.com", "https://www.getnoden.com", "http://localhost:3300", "http://localhost:3917"]);

function corsHeaders(origin: string | null) {
  const headers = new Headers();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return headers;
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin"));
  const body = await request.json().catch(() => null);

  // Honeypot: real visitors never see or fill this field. Pretend success to bots.
  if (typeof body?.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201, headers });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const plan = typeof body?.plan === "string" ? body.plan : "";
  const interval = typeof body?.interval === "string" && INTERVALS.has(body.interval) ? body.interval : "monthly";

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers });
  }
  if (!(plan in PLANS)) {
    return NextResponse.json({ error: "Choose a plan." }, { status: 400, headers });
  }

  const pitch = `Plan: ${PLANS[plan]} · ${interval}`;

  // The same person re-submitting the same choice within a day is not a new lead.
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const duplicate = await db.sellerLead.findFirst({
    where: { email, source: SOURCE, pitch, createdAt: { gte: since } },
    select: { id: true },
  });
  if (duplicate) return NextResponse.json({ ok: true }, { status: 200, headers });

  await db.sellerLead.create({ data: { name: "Plan waitlist", email, pitch, source: SOURCE } });

  // Best-effort: the entry is already saved whether or not the email goes out.
  void sendEmail(
    NOTIFY_EMAIL,
    `Plan waitlist: ${PLANS[plan]} (${interval})`,
    `Someone joined the paid-plan waitlist.\n\nEmail: ${email}\nPlan: ${PLANS[plan]}\nBilling: ${interval}`
  );

  return NextResponse.json({ ok: true }, { status: 201, headers });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}
