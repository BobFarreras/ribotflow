/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/team/TeamRow.tsx
 * Description: A single row in the team list. Renders the user identity
 *              (avatar initials + name + email), role, status, and a set
 *              of inline actions (change role, deactivate/reactivate,
 *              resend/revoke invitation). All actions go through Server
 *              Actions and refresh the page on success.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MoreHorizontal, UserMinus, UserCheck, RefreshCw, X } from "lucide-react";
import { RoleBadge } from "./RoleBadge";
import { MemberStatusBadge } from "./MemberStatusBadge";
import { changeUserRoleAction } from "@/actions/sat/team/changeUserRole";
import { deactivateUserAction } from "@/actions/sat/team/deactivateUser";
import { reactivateUserAction } from "@/actions/sat/team/reactivateUser";
import { revokeInvitationAction } from "@/actions/sat/team/revokeInvitation";
import { resendInvitationAction } from "@/actions/sat/team/resendInvitation";
import type { TeamMemberView, TeamRole } from "@/services/sat/team";

interface Props {
  member: TeamMemberView;
  /** Whether the current viewer is allowed to write to the team. */
  canManage: boolean;
}

const ASSIGNABLE_ROLES: Exclude<TeamRole, "OWNER">[] = ["ADMIN", "TECHNICIAN", "OFFICE"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function TeamRow({ member, canManage }: Props) {
  const router = useRouter();
  const t = useTranslations("sat.settings.team.row");
  const tList = useTranslations("sat.settings.team");
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const closeMenu = () => setMenuOpen(false);

  const run = (fn: () => Promise<{ success: boolean; error?: string }>) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.success) setFeedback(result.error ?? tList("errors.generic"));
      else {
        closeMenu();
        router.refresh();
      }
    });
  };

  const isPendingInvite = member.status === "pending";
  const isInactive = member.status === "inactive";
  const editable = canManage && !member.isOwner && !member.isSelf;

  return (
    <tr className="border-b border-[color:var(--border)] last:border-0">
      <td className="py-3 pl-4 pr-2 align-middle">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)]/12 text-sm font-semibold text-[color:var(--primary)]">
            {initials(member.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-[color:var(--text)]">
                {member.name}
              </span>
              {member.isSelf && (
                <span className="rounded bg-[color:var(--surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">
                  {t("you")}
                </span>
              )}
            </div>
            <div className="truncate text-xs text-[color:var(--text-muted)]">{member.email}</div>
          </div>
        </div>
      </td>

      <td className="px-2 py-3 align-middle">
        <RoleBadge role={member.role} size="sm" />
      </td>

      <td className="px-2 py-3 align-middle">
        <MemberStatusBadge
          status={member.status}
          invitedAt={member.invitedAt}
          labels={{
            active: tList("status.active"),
            inactive: tList("status.inactive"),
            pending: tList("status.pending"),
            invitedDaysAgo: (n) => tList("status.invitedDaysAgo", { days: n }),
            expired: tList("status.expired"),
          }}
        />
      </td>

      <td className="px-2 py-3 text-right align-middle pr-4">
        {canManage && !member.isOwner ? (
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              disabled={isPending}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t("actions")}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] disabled:opacity-50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-10 mt-1 w-56 origin-top-right rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] py-1 shadow-lg"
              >
                {/* Change role */}
                {!isPendingInvite && editable && (
                  <div className="px-3 py-2">
                    <label
                      htmlFor={`role-select-${member.id}`}
                      className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]"
                    >
                      {t("changeRole")}
                    </label>
                    <select
                      id={`role-select-${member.id}`}
                      value={member.role}
                      disabled={isPending}
                      onChange={(e) => {
                        const newRole = e.target.value as Exclude<TeamRole, "OWNER">;
                        if (newRole === member.role) return;
                        run(async () => {
                          const r = await changeUserRoleAction({
                            userId: member.id,
                            role: newRole,
                          });
                          if (r.success) {
                            setFeedback(`${t("roleChanged")} · ${t("reloginRequired")}`);
                          }
                          return r;
                        });
                      }}
                      className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg)] px-2 py-1.5 text-xs text-[color:var(--text)] outline-none focus:border-[color:var(--primary)] disabled:opacity-50"
                    >
                      <option value="" disabled>
                        {t("selectRole")}
                      </option>
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {tList(`roles.${r}.label`)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Resend / Revoke invitation */}
                {isPendingInvite && (
                  <>
                    <button
                      type="button"
                      disabled={isPending || member.isSelf}
                      onClick={() => run(() => resendInvitationAction({ userId: member.id }))}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)] disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t("resend")}
                    </button>
                    <button
                      type="button"
                      disabled={isPending || member.isSelf}
                      onClick={() => run(() => revokeInvitationAction({ userId: member.id }))}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--danger)] transition-colors hover:bg-[color:var(--surface-2)] disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t("revoke")}
                    </button>
                  </>
                )}

                {/* Deactivate / Reactivate */}
                {!isPendingInvite && editable && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      run(() =>
                        isInactive
                          ? reactivateUserAction({ userId: member.id })
                          : deactivateUserAction({ userId: member.id })
                      )
                    }
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[color:var(--surface-2)] disabled:opacity-50 ${
                      isInactive ? "text-[color:var(--text)]" : "text-[color:var(--danger)]"
                    }`}
                  >
                    {isInactive ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        {t("reactivate")}
                      </>
                    ) : (
                      <>
                        <UserMinus className="h-3.5 w-3.5" />
                        {t("deactivate")}
                      </>
                    )}
                  </button>
                )}

                {feedback && (
                  <div className="border-t border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--danger)]">
                    {feedback}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-[color:var(--text-muted)]">—</span>
        )}
      </td>
    </tr>
  );
}
