/**
 * Creation/modification date: 21/05/2026
 * Path: src/proxy.ts
 * Description: Next.js 16 proxy with Next-Auth v5 authorization.
 *              Uses auth() wrapper to read session from request cookies.
 */

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  if (!req.auth?.user) {
    // Let Next-Auth handle the redirect (via authorized callback)
    return NextResponse.next();
  }

  // Inject headers for downstream use
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-role", req.auth.user.role);
  requestHeaders.set("x-company-id", req.auth.user.companyId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
