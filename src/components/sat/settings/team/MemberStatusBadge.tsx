/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/team/MemberStatusBadge.tsx
 * Description: Pill that displays the current status of a team member
 *              (active / inactive / pending). For pending users it shows
 *              a small "Invitation sent N days ago" hint.
 */

import { CheckCircle2, Clock, XCircle } from "lucide-react";
import type { UserStatus } from "@/services/sat/team";

interface Props {
  status: UserStatus;
  invitedAt?: Date | string | null;
  labels: {
    active: string;
    inactive: string;
    pending: string;
    invitedDaysAgo: (days: number) => string;
    expired: string;
  };
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function MemberStatusBadge({ status, invitedAt, labels }: Props) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 px-2.5 py-1 text-xs font-medium text-[color:var(--success)]">
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        {labels.active}
      </span>
    );
  }
  if (status === "inactive") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--text-muted)]/30 bg-[color:var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[color:var(--text-muted)]">
        <XCircle className="h-3 w-3" aria-hidden />
        {labels.inactive}
      </span>
    );
  }
  // pending
  const days = invitedAt ? daysBetween(new Date(invitedAt), new Date()) : 0;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-2.5 py-1 text-xs font-medium text-[color:var(--warning)]">
      <Clock className="h-3 w-3" aria-hidden />
      {labels.pending}
      <span className="text-[color:var(--text-muted)]" aria-hidden>·</span>
      <span className="text-[color:var(--text-muted)]">
        {days <= 0 ? labels.invitedDaysAgo(0) : labels.invitedDaysAgo(days)}
      </span>
    </span>
  );
}
