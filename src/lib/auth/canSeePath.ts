/**
 * Creation/modification date: 02/06/2026
 * Path: src/lib/auth/canSeePath.ts
 * Description: Maps a URL pathname to the permission required to enter it.
 *              Used by the Next.js proxy (src/proxy.ts) to gate access at the
 *              edge, and by the SidebarNav to hide links the user cannot use.
 *
 *              Patterns are tested in declaration order; the first match wins.
 *              Keep this file as the single source of truth for which paths
 *              require which permissions.
 */

import { can } from "./permissions";
import type { Permission } from "./permissions";
import type { Role } from "./roles";

interface PathRule {
  /** RegExp tested against the pathname (no query, no locale prefix). */
  pattern: RegExp;
  /** Permission required to view any URL matching the pattern. */
  permission: Permission;
}

/**
 * Order matters: more specific patterns first.
 * Each path under /settings, /sat, /erp, /billing, /crm, /access and /admin
 * is gated here.
 */
const PATH_RULES: readonly PathRule[] = [
  // --- Settings (admin-area) -----------------------------------------
  { pattern: /^\/settings\/company(\/|$)/, permission: "company:read" },
  { pattern: /^\/settings\/email(\/|$)/,   permission: "email:read" },
  { pattern: /^\/settings\/team(\/|$)/,    permission: "team:read" },
  { pattern: /^\/settings\/profile(\/|$)/, permission: "profile:read:self" },
  { pattern: /^\/settings\/billing(\/|$)/, permission: "billing:read" },
  { pattern: /^\/settings(\/|$)/,          permission: "company:read" },

  // --- SAT module ----------------------------------------------------
  { pattern: /^\/sat\/quotes(\/|$)/,       permission: "quote:read" },
  { pattern: /^\/sat\/clients(\/|$)/,      permission: "client:read" },
  { pattern: /^\/sat\/categories(\/|$)/,   permission: "material:read" },
  { pattern: /^\/sat\/routes(\/|$)/,       permission: "route:read" },
  { pattern: /^\/sat\/map(\/|$)/,          permission: "route:read" },
  { pattern: /^\/sat\/field(\/|$)/,        permission: "workorder:read:own" },
  { pattern: /^\/sat\/work-orders(\/|$)/,  permission: "workorder:read:own" },
  { pattern: /^\/sat(\/|$)/,               permission: "workorder:read:own" },

  // --- ERP / Billing / CRM / Access ----------------------------------
  { pattern: /^\/erp(\/|$)/,               permission: "material:read" },
  { pattern: /^\/billing(\/|$)/,           permission: "invoice:read" },
  { pattern: /^\/crm(\/|$)/,               permission: "client:read" },
  { pattern: /^\/access(\/|$)/,            permission: "workorder:read:own" },

  // --- Dashboard (everyone authenticated) ----------------------------
  { pattern: /^\/dashboard(\/|$)/,         permission: "profile:read:self" },
];

/**
 * Returns the permission needed to view a given pathname, or null if the
 * path is public / does not require any check.
 */
export function requiredPermissionFor(pathname: string): Permission | null {
  for (const rule of PATH_RULES) {
    if (rule.pattern.test(pathname)) return rule.permission;
  }
  return null;
}

/**
 * Convenience: can this role view this path?
 * Returns true for paths that are not gated.
 */
export function canSeePath(role: Role, pathname: string): boolean {
  const required = requiredPermissionFor(pathname);
  if (!required) return true;
  return can(role, required);
}
