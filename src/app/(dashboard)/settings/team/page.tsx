/**
 * Creation/modification date: 06/06/2026
 * Path: src/app/(dashboard)/settings/team/page.tsx
 * Description: Team management page. Lists every member of the current
 *              company (active, inactive, pending) and exposes the
 *              invite / change-role / deactivate / resend / revoke actions.
 *              Read access: any role with team:read (OWNER, ADMIN, OFFICE).
 *              Write access: OWNER only (gated inside actions and UI).
 */

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Building2 } from "lucide-react";
import { listTeamMembersAction } from "@/actions/sat/team/listTeamMembers";
import { TeamTable } from "@/components/sat/settings/team/TeamTable";
import { StatusPill } from "@/components/sat/settings/StatusPill";

export default async function TeamSettingsPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }
  if (!can(session.user.role, "team:read")) {
    redirect("/dashboard");
  }

  const t = await getTranslations("sat.settings.team");
  const tCompany = await getTranslations("sat.settings.company");
  const tStatus = await getTranslations("sat.settings.company.status");

  const { members } = await listTeamMembersAction();
  const canManage = can(session.user.role, "team:write");

  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "pending").length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mx-auto mb-6 max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
              <Users className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-[color:var(--text)]">
                {t("title")}
              </h1>
              <p className="text-sm text-[color:var(--text-muted)]">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              configured={activeCount > 0}
              lastUpdated={null}
              labels={{
                active: t("header.activeCount", { count: activeCount }),
                inactive: t("header.noActive"),
                updatedAt: "",
              }}
            />
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/10 px-3 py-1.5 text-sm text-[color:var(--warning)]">
                {t("header.pendingCount", { count: pendingCount })}
              </span>
            )}
            <Link
              href="/settings/company"
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)]"
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {tCompany("title")}
            </Link>
          </div>
        </div>
      </header>

      <TeamTable members={members} canManage={canManage} />
    </div>
  );
}
