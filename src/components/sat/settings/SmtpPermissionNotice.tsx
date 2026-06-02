/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpPermissionNotice.tsx
 * Description: Read-only banner shown to non-OWNER users explaining what
 *              they can/cannot do in the SMTP settings.
 */

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";

interface Props {
  role: "OWNER" | "ADMIN" | "TECHNICIAN" | "OFFICE";
}

export function SmtpPermissionNotice({ role }: Props) {
  const t = useTranslations("sat.settings.email.permissions");
  const message = role === "ADMIN" ? t("adminReadOnly") : t("ownerOnly");

  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-[color:var(--info)]/30 bg-[color:var(--info)]/8 p-3"
    >
      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--info)]" aria-hidden />
      <p className="text-sm text-[color:var(--text)]">{message}</p>
    </div>
  );
}
