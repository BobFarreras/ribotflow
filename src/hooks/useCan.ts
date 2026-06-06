/**
 * Creation/modification date: 02/06/2026
 * Path: src/hooks/useCan.ts
 * Description: Client-side permission hook. Reads the user's role from the
 *              current Auth.js session (via the same JWT we use on the
 *              server) and exposes the can() / canAny() helpers for use
 *              in client components.
 *
 *              The hook is for UI affordance only — hiding a button is a
 *              UX nicety, not a security boundary. The server-side proxy
 *              and every Server Action still enforce the matrix.
 */

"use client";

import { useSession } from "next-auth/react";
import { can, canAny } from "@/lib/auth/permissions";
import type { Permission } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/roles";

export interface UseCanResult {
  role: Role | null;
  can: (permission: Permission) => boolean;
  canAny: (permissions: readonly Permission[]) => boolean;
}

export function useCan(): UseCanResult {
  const { data } = useSession();
  const role = (data?.user?.role ?? null) as Role | null;
  return {
    role,
    can: (permission) => (role ? can(role, permission) : false),
    canAny: (permissions) => (role ? canAny(role, permissions) : false),
  };
}
