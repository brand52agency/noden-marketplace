import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// /operator itself is a public landing page explaining what an
// operator account is for — only the actual account pages underneath
// it require login. /marketplace is fully public (agents and humans
// browse without an account).
const PROTECTED_OPERATOR_PREFIXES = ["/operator/setup", "/operator/dashboard", "/operator/audit-log", "/operator/credits", "/operator/kits"];

// Auth.js rewrites req.nextUrl to the NEXTAUTH_URL environment value when one is set, so redirects built from
// req.nextUrl.origin can point at a stale host. Build them from the address the visitor actually used.
function visitorOrigin(req: { headers: Headers; nextUrl: { origin: string } }): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return req.nextUrl.origin;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0] ?? (/^(localhost|127\.0\.0\.1)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

export default auth((req) => {
  const origin = visitorOrigin(req);
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth);
  const isAdmin = req.auth?.user?.role === "admin";

  const needsOperatorLogin = PROTECTED_OPERATOR_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (needsOperatorLogin && !isLoggedIn) {
    const url = new URL("/login", origin);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL(isLoggedIn ? "/operator/dashboard" : "/login", origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/operator/:path*", "/admin/:path*"],
};
