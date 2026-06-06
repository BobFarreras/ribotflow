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
import { Building2 } from "lucide-react";
import { getCompanySettingsAction } from "@/actions/sat/company/getCompanySettings";
import { CompanySettingsForm } from "@/components/sat/settings/CompanySettingsForm";

export default async function CompanySettingsPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const t = await getTranslations("sat.settings.company");
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

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mx-auto mb-8 max-w-3xl">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
            <Building2 className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[color:var(--text)]">
              {t("title")}
            </h1>
            <p className="mt-1 text-base text-[color:var(--text-muted)]">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </header>

      <CompanySettingsForm initial={result.data} userRole={session.user.role} />
    </div>
  );
}
