/**
 * Creation/modification date: 02/06/2026
 * Path: src/lib/auth/roles.ts
 * Description: Single source of truth for the four user roles supported by
 *              Ribotflow. Provides a numeric hierarchy that callers can use
 *              to ask "is role X at least as privileged as role Y?" without
 *              hard-coding the order in every check.
 *
 *              Mirrors the `Role` type in src/types/index.ts. Kept as a
 *              separate file to keep the permission system (this folder)
 *              self-contained and to give us a place to attach helpers that
 *              the central types module should not depend on.
 */

export const ROLES = ["OWNER", "ADMIN", "OFFICE", "TECHNICIAN"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Higher number = more privileged. Used for "is at least" checks. This is
 * deliberately a partial order: TECHNICIAN is a peer of OFFICE, not below
 * it (they have different access patterns, not strictly less access).
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 100,
  ADMIN: 80,
  OFFICE: 50,
  TECHNICIAN: 50,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isAtLeast(role: Role, min: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[min];
}
