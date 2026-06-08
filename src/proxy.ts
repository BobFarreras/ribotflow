/**
 * Creation/modification date: 02/06/2026
 * Path: src/proxy.ts
 * Description: Next.js 16 proxy with Next-Auth v5 session validation and
 *              role-based access control. The route allowlist now lives in
 *              src/lib/auth/canSeePath.ts so it stays in sync with the
 *              SidebarNav and the PermissionGuard.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canSeePath } from "@/lib/auth/canSeePath";
import type { Role } from "@/lib/auth/roles";

const PUBLIC_ROUTES = ["/login", "/register", "/setup", "/api/health", "/accept-invitation"];

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

  // RBAC check via the shared permission map
  const userRole = req.auth.user.role as Role;
  if (!canSeePath(userRole, pathname)) {
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
