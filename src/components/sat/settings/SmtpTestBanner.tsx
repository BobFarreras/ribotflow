/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpTestBanner.tsx
 * Description: Visual feedback banner for the "Test connection" result.
 *              Shows success/failure with a hint and a cert-specific help
 *              message when the failure is certificate-related.
 */

import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle } from "lucide-react";

interface TestResult {
  ok: boolean;
  msg: string;
}

interface Props {
  result: TestResult | null;
  onDismiss?: () => void;
}

export function SmtpTestBanner({ result }: Props) {
  const t = useTranslations("sat.settings.email.feedback");

  if (!result) return null;

  const isCertError = !result.ok && result.msg.toLowerCase().includes("self-signed");
  const titleKey = result.ok ? "testSuccess" : "testFailed";
  const hintKey = result.ok ? "testSuccessHint" : "testFailedHint";

  return (
    <div
      role={result.ok ? "status" : "alert"}
      aria-live={result.ok ? "polite" : "assertive"}
      className={
        "flex items-start gap-3 rounded-lg border p-3 " +
        (result.ok
          ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/8 text-[color:var(--success)]"
          : "border-[color:var(--danger)]/30 bg-[color:var(--danger)]/8 text-[color:var(--danger)]")
      }
    >
      {result.ok ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t(titleKey)}</p>
        <p className="mt-0.5 text-sm opacity-90">{t(hintKey)}</p>
        {!result.ok && (
          <p className="mt-1 font-mono text-xs opacity-80 break-words">
            {result.msg}
          </p>
        )}
        {isCertError && (
          <p className="mt-2 rounded-md border border-current/30 bg-[color:var(--surface)]/40 p-2 text-xs text-[color:var(--text)]">
            {t("testCertHelp")}
          </p>
        )}
      </div>
    </div>
  );
}
