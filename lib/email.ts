import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resend's shared `onboarding@resend.dev` sender only delivers to the Resend
// account owner. Verification emails reach real users only once a sending
// domain is verified in Resend and EMAIL_FROM is set to an address on it.
const FROM = process.env.EMAIL_FROM ?? "Noden <onboarding@resend.dev>";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shop.getnoden.com";

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!resend) {
    console.warn(`email not sent to ${to}: RESEND_API_KEY is not set`);
    return false;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, text });
    if (error) {
      console.error("email send failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("email send failed:", err);
    return false;
  }
}
