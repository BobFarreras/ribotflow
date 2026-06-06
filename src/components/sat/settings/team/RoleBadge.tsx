/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/team/RoleBadge.tsx
 * Description: Coloured pill that displays a role (OWNER/ADMIN/TECHNICIAN/OFFICE).
 *              Used in the team list and the row's role selector.
 */

import { Crown, Shield, Briefcase, Wrench } from "lucide-react";
import type { TeamRole } from "@/services/sat/team";

interface Props {
  role: TeamRole;
  size?: "sm" | "md";
}

const META: Record<TeamRole, { label: string; classes: string; Icon: typeof Crown }> = {
  OWNER: {
    label: "Propietari",
    classes:
      "border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
    Icon: Crown,
  },
  ADMIN: {
    label: "Administrador",
    classes:
      "border-[color:var(--primary)]/40 bg-[color:var(--primary)]/10 text-[color:var(--primary)]",
    Icon: Shield,
  },
  TECHNICIAN: {
    label: "Tècnic",
    classes:
      "border-[color:var(--info)]/40 bg-[color:var(--info)]/10 text-[color:var(--info)]",
    Icon: Wrench,
  },
  OFFICE: {
    label: "Oficina",
    classes:
      "border-[color:var(--text-muted)]/30 bg-[color:var(--surface-2)] text-[color:var(--text)]",
    Icon: Briefcase,
  },
};

export function RoleBadge({ role, size = "md" }: Props) {
  const meta = META[role];
  const Icon = meta.Icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${pad} ${meta.classes}`}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {meta.label}
    </span>
  );
}
