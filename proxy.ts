import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// /operator itself is a public landing page explaining what an
// operator account is for — only the actual account pages underneath
// it require login. /marketplace is fully public (agents and humans
// browse without an account).
const PROTECTED_OPERATOR_PREFIXES = ["/operator/setup", "/operator/dashboard", "/operator/audit-log"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth);
  const isAdmin = req.auth?.user?.role === "admin";

  const needsOperatorLogin = PROTECTED_OPERATOR_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (needsOperatorLogin && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL(isLoggedIn ? "/operator/dashboard" : "/login", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/operator/:path*", "/admin/:path*"],
};
