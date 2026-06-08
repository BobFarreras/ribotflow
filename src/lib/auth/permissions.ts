/**
 * Creation/modification date: 02/06/2026
 * Path: src/lib/auth/permissions.ts
 * Description: Central permission matrix. The `Role` enum in roles.ts is the
 *              key; the `Permission` enum is the value. Every Server Action,
 *              Server Component and client UI that needs to gate behaviour
 *              should ask `can(role, permission)` instead of comparing the
 *              role string directly.
 *
 *              Conventions:
 *              - `<resource>:read` / `<resource>:write`  -> all-or-nothing.
 *              - `<resource>:read:own` / `<resource>:read:all`  -> row-level
 *                filter; "own" is enforced at the query layer, not here.
 *              - Permissions ending in `:self`  -> the user is acting on
 *                their own user record (e.g. /settings/profile).
 */

import type { Role } from "./roles";

export const PERMISSIONS = [
  "company:read",
  "company:write",
  "email:read",
  "email:write",
  "team:read",
  "team:write",
  "profile:read:self",
  "profile:write:self",
  "workorder:read:all",
  "workorder:read:own",
  "workorder:write:all",
  "workorder:write:own",
  "client:read",
  "client:write",
  "quote:read",
  "quote:write",
  "invoice:read",
  "invoice:write",
  "material:read",
  "material:write",
  "route:read",
  "route:write",
  "billing:read",
  "billing:write",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

/**
 * The single source of truth for "who can do what".
 * Update this matrix and the rest of the app picks it up automatically.
 */
export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set<Permission>(ALL),
  ADMIN: new Set<Permission>([
    "company:read",
    "team:read",
    "profile:read:self",
    "profile:write:self",
    "workorder:read:all",
    "workorder:write:all",
    "client:read",
    "client:write",
    "quote:read",
    "quote:write",
    "invoice:read",
    "invoice:write",
    "material:read",
    "material:write",
    "route:read",
    "route:write",
  ]),
  OFFICE: new Set<Permission>([
    "company:read",
    "team:read",
    "profile:read:self",
    "profile:write:self",
    "workorder:read:all",
    "client:read",
    "client:write",
    "quote:read",
    "quote:write",
    "invoice:read",
    "invoice:write",
    "material:read",
    "route:read",
  ]),
  TECHNICIAN: new Set<Permission>([
    "company:read",
    "profile:read:self",
    "profile:write:self",
    "workorder:read:own",
    "workorder:write:own",
    "client:read",
    "material:read",
    "route:read",
  ]),
};

/**
 * Returns true if the role has the given permission.
 * Use this everywhere — never compare role strings directly.
 */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

/**
 * Returns true if the role has at least one of the given permissions.
 * Useful for "visible to OWNER or ADMIN" type checks.
 */
export function canAny(role: Role, permissions: readonly Permission[]): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return permissions.some((p) => granted.has(p));
}

/**
 * Returns true if the role has all of the given permissions.
 */
export function canAll(role: Role, permissions: readonly Permission[]): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return permissions.every((p) => granted.has(p));
}
