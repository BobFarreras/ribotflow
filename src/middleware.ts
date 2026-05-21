/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/middleware.ts
 * Descripció: Middleware de seguretat i control de rols RBAC.
 *             Intercepta totes les rutes protegides i verifica sessió + permisos.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ROUTES, ROLES } from "@/lib/constants";

const PUBLIC_ROUTES = ["/login", "/register", "/setup", "/api/health"];
const PROTECTED_PREFIXES = ["/dashboard", "/api"];

const ROLE_ROUTE_MATRIX: Record<string, string[]> = {
  OWNER: ["/dashboard"],
  ADMIN: ["/dashboard"],
  OFFICE: ["/dashboard"],
  TECHNICIAN: ["/dashboard/sat", "/dashboard/access"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix) && !pathname.startsWith("/api/auth")
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = session.user.role;

  if (userRole === "TECHNICIAN") {
    const allowedRoutes = ROLE_ROUTE_MATRIX.TECHNICIAN;
    const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

    if (!isAllowed) {
      return NextResponse.redirect(new URL("/dashboard/unauthorized", request.url));
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-role", userRole);
  requestHeaders.set("x-company-id", session.user.companyId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
