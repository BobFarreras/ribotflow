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
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-md border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/8 p-4 text-sm text-[color:var(--danger)]">
          {t("errors.load")}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--primary)] text-white">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--text)]">{t("title")}</h1>
          <p className="text-sm text-[color:var(--text-muted)]">{t("subtitle")}</p>
        </div>
      </div>

      <CompanySettingsForm initial={result.data} userRole={session.user.role} />
    </div>
  );
}
