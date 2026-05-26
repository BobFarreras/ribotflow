/**
 * Creation/modification date: 21/05/2026
 * Path: src/proxy.ts
 * Description: Next.js 16 proxy with Next-Auth v5 session validation.
 *              Uses auth() wrapper to read session from request cookies.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/register", "/setup", "/api/health"];

const ROLE_ROUTE_MATRIX: Record<string, string[]> = {
  OWNER: ["/dashboard", "/sat", "/erp", "/billing", "/crm", "/access", "/settings"],
  ADMIN: ["/dashboard", "/sat", "/erp", "/billing", "/crm", "/access", "/settings"],
  OFFICE: ["/dashboard", "/sat", "/erp", "/billing", "/crm", "/access", "/settings"],
  TECHNICIAN: ["/dashboard", "/sat", "/access"],
};

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // Always allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Always allow Next-Auth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // If no session, redirect to login
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC check
  const userRole = req.auth.user.role;
  const allowedRoutes = ROLE_ROUTE_MATRIX[userRole] ?? [];
  const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!isAllowed) {
    return NextResponse.redirect(new URL("/dashboard/unauthorized", req.url));
  }

  // Inject headers for downstream Server Components/Actions
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
