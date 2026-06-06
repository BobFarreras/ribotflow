/**
 * Creation/modification date: 02/06/2026
 * Path: src/app/(dashboard)/settings/email/page.tsx
 * Description: Settings page for the company's per-tenant SMTP configuration.
 *              Server Component: auth check + initial load + render client form.
 */

import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { getSmtpConfigAction } from "@/actions/sat/company/getSmtpConfig";
import { SmtpSettingsForm } from "@/components/sat/settings/SmtpSettingsForm";

export default async function EmailSettingsPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const t = await getTranslations("sat.settings.email");
  const result = await getSmtpConfigAction();
  const initialConfig = result.success ? (result.data ?? null) : null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--primary)] text-white">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--text)]">{t("title")}</h1>
          <p className="text-sm text-[color:var(--text-muted)]">{t("subtitle")}</p>
        </div>
      </div>

      <SmtpSettingsForm initialConfig={initialConfig} userRole={session.user.role} />
    </div>
  );
}
