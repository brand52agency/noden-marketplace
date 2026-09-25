import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";

const NOTIFY_EMAIL = "getnoden@proton.me";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Called cross-origin from getnoden.com/earn's signup form, so this
// needs its own CORS handling — every other route here is same-origin
// (called from this app itself, or by an API client with no CORS
// concept at all) and doesn't need any of this.
const ALLOWED_ORIGINS = new Set([
  "https://getnoden.com",
  "https://www.getnoden.com",
  "http://localhost:3300",
]);

function corsHeaders(origin: string | null) {
  const headers = new Headers();
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return headers;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const pitch = typeof body?.pitch === "string" ? body.pitch.trim().slice(0, 2000) : null;
  const source = typeof body?.source === "string" && body.source.trim() ? body.source.trim().slice(0, 100) : "earn-page";

  if (!name || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "name and a valid email are required" }, { status: 400, headers });
  }

  await db.sellerLead.create({
    data: { name, email, pitch: pitch || null, source },
  });

  // Best-effort — a lead is already saved above regardless of whether this
  // notification succeeds, so a Resend outage should never fail the signup.
  if (resend) {
    resend.emails
      .send({
        from: "Noden Leads <onboarding@resend.dev>",
        to: NOTIFY_EMAIL,
        replyTo: email,
        subject: `New lead: ${name} (${source})`,
        text: `Name: ${name}\nEmail: ${email}\nSource: ${source}${pitch ? `\nPitch: ${pitch}` : ""}`,
      })
      .catch((err) => console.error("seller-lead notification email failed:", err));
  }

  return NextResponse.json({ ok: true }, { status: 201, headers });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}
