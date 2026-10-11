import { NextResponse } from "next/server";

// Deletes the one-time API key cookie once the page has shown it. A plain route handler (not a
// server action) so clearing it doesn't make Next re-render the page and hide the key again.
export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set("noden_new_key", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
