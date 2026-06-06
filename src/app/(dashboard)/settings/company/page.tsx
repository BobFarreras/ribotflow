/**
 * Creation/modification date: 02/06/2026
 * Path: src/app/(dashboard)/settings/company/page.tsx
 * Description: Settings page for the company's identity, address, preferences,
 *              documents, and branding. Server Component: auth + initial load.
 *              Redirects to login if not authenticated.
 */

import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Mail } from "lucide-react";
import { getCompanySettingsAction } from "@/actions/sat/company/getCompanySettings";
import { CompanySettingsForm } from "@/components/sat/settings/CompanySettingsForm";
import { StatusPill } from "@/components/sat/settings/StatusPill";

export default async function CompanySettingsPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const t = await getTranslations("sat.settings.company");
  const tStatus = await getTranslations("sat.settings.company.status");
  const tEmail = await getTranslations("sat.settings.email");

  const result = await getCompanySettingsAction();

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--surface)] p-5 text-base text-[color:var(--danger)] shadow-sm">
          {t("errors.load")}
        </div>
      </div>
    );
  }

  const isConfigured = !!(result.data.name && result.data.taxId);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mx-auto mb-6 max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
              <Building2 className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-[color:var(--text)]">
                {t("title")}
              </h1>
              <p className="text-sm text-[color:var(--text-muted)]">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              configured={isConfigured}
              lastUpdated={result.data.updatedAt}
              labels={{
                active: tStatus("active"),
                inactive: tStatus("inactive"),
                updatedAt: tStatus("updatedAt"),
              }}
            />
            <Link
              href="/settings/email"
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)]"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {tEmail("title")}
            </Link>
          </div>
        </div>
      </header>

      <CompanySettingsForm initial={result.data} userRole={session.user.role} />
    </div>
  );
}
