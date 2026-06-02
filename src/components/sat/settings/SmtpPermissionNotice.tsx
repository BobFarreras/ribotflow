/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpPermissionNotice.tsx
 * Description: Read-only notice shown to non-OWNER roles when viewing SMTP settings.
 */

"use client";

import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

interface Props {
  role: string;
}

export function SmtpPermissionNotice({ role }: Props) {
  const t = useTranslations("sat.settings.email.permissions");

  return (
    <div className="flex items-start gap-3 rounded-lg border border-[color:var(--info)]/30 bg-[color:var(--info)]/5 p-4">
      <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--info)]" aria-hidden />
      <div>
        <p className="text-sm font-medium text-[color:var(--info)]">
          {role === "ADMIN" ? t("adminReadOnly") : t("ownerOnly")}
        </p>
        <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
          {t("adminCanTest")}
        </p>
      </div>
    </div>
  );
}