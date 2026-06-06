/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/team/TeamTable.tsx
 * Description: Client wrapper that renders the team list table and owns
 *              the invite-user modal. The actual data is fetched by the
 *              server-component page and passed in.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { TeamRow } from "./TeamRow";
import { InviteUserForm } from "./InviteUserForm";
import type { TeamMemberView } from "@/services/sat/team";

interface Props {
  members: TeamMemberView[];
  /** True if the current viewer has team:write (OWNER). */
  canManage: boolean;
}

export function TeamTable({ members, canManage }: Props) {
  const t = useTranslations("sat.settings.team");
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--text)]">
            {t("membersTitle", { count: members.length })}
          </h2>
          <p className="text-sm text-[color:var(--text-muted)]">{t("membersSubtitle")}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--primary)] px-3.5 py-2 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            {t("invite.button")}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-2)] text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
              <th scope="col" className="w-[40%] py-2.5 pl-4 pr-2 font-semibold">
                {t("columns.user")}
              </th>
              <th scope="col" className="w-[20%] px-2 py-2.5 font-semibold">
                {t("columns.role")}
              </th>
              <th scope="col" className="w-[25%] px-2 py-2.5 font-semibold">
                {t("columns.status")}
              </th>
              <th scope="col" className="w-[15%] py-2.5 pr-4 font-semibold text-right">
                <span className="sr-only">{t("columns.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-[color:var(--text-muted)]">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              members.map((m) => <TeamRow key={m.id} member={m} canManage={canManage} />)
            )}
          </tbody>
        </table>
      </div>

      {showInvite && <InviteUserForm onClose={() => setShowInvite(false)} />}
    </div>
  );
}
