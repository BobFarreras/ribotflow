/**
 * Creation/modification date: 21/05/2026
 * Path: src/proxy.ts
 * Description: Next.js 16 proxy (formerly middleware) with Next-Auth v5 integration.
 *              Uses auth() wrapper to access session from request cookies.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/register", "/setup", "/api/health"];

const ROLE_ROUTE_MATRIX: Record<string, string[]> = {
  OWNER: ["/dashboard"],
  ADMIN: ["/dashboard"],
  OFFICE: ["/dashboard"],
  TECHNICIAN: ["/dashboard/sat", "/dashboard/access"],
};

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes always allowed
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // API auth routes always allowed
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check if protected
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/api");
  if (!isProtected) {
    return NextResponse.next();
  }

  // No session → redirect to login
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC for TECHNICIAN
  const userRole = req.auth.user.role;
  if (userRole === "TECHNICIAN") {
    const allowedRoutes = ROLE_ROUTE_MATRIX.TECHNICIAN;
    const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));
    if (!isAllowed) {
      return NextResponse.redirect(new URL("/dashboard/unauthorized", req.url));
    }
  }

  // Inject headers for downstream use
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-role", userRole);
  requestHeaders.set("x-company-id", req.auth.user.companyId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
