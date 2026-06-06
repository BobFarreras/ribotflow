/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/layout/PermissionGuard.tsx
 * Description: Client-side wrapper that hides children unless the current
 *              user has the required permission. Use to gate buttons,
 *              dropdown items, settings sections, etc.
 *
 *              This is a UI affordance. The same gate is enforced on the
 *              server (proxy.ts + Server Actions) - this component only
 *              prevents the user from seeing something they cannot use.
 */

"use client";

import type { ReactNode } from "react";
import { useCan } from "@/hooks/useCan";
import type { Permission } from "@/lib/auth/permissions";

interface Props {
  /** Required permission. */
  permission?: Permission;
  /** Alternative: any of these permissions. */
  anyOf?: readonly Permission[];
  /** Rendered when the user lacks the permission. Defaults to null. */
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ permission, anyOf, fallback = null, children }: Props) {
  const { can, canAny, role } = useCan();
  if (!role) return <>{fallback}</>;
  if (permission && !can(permission)) return <>{fallback}</>;
  if (anyOf && !canAny(anyOf)) return <>{fallback}</>;
  return <>{children}</>;
}
