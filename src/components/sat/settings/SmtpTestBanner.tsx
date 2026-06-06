/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpTestBanner.tsx
 * Description: Success/failure banner shown after testing SMTP connection.
 *              Shows clear feedback with contextual help for cert errors.
 */

"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export interface TestResult {
  success: boolean;
  error?: string | null;
}

interface Props {
  result: TestResult | null;
}

export function SmtpTestBanner({ result }: Props) {
  const t = useTranslations("sat.settings.email.feedback");

  if (!result) return null;

  const isCertError =
    !result.success &&
    (result.error?.toLowerCase().includes("self-signed") ||
      result.error?.toLowerCase().includes("certificate") ||
      result.error?.toLowerCase().includes("cert"));

  if (result.success) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-4">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--success)]"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium text-[color:var(--success)]">{t("testSuccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/5 p-4">
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--danger)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[color:var(--danger)]">{t("testFailed")}</p>
          {result.error && (
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">{result.error}</p>
          )}
        </div>
      </div>
      {isCertError && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/5 p-3">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--warning)]"
            aria-hidden
          />
          <p className="text-xs text-[color:var(--text-muted)]">{t("testCertHelp")}</p>
        </div>
      )}
    </div>
  );
}
