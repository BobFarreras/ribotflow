/**
 * Creation/modification date: 01/06/2026
 * Path: src/lib/utils/smtpErrors.ts
 * Description: Helpers to detect and explain common SMTP transport errors.
 *              Extracted from notificationService for testability and reuse.
 */

export function isCertError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("self-signed certificate") ||
    msg.includes("unable to verify") ||
    msg.includes("cert_has_expired") ||
    msg.includes("err_tls_cert_altname_invalid") ||
    (err as NodeJS.ErrnoException).code === "ESOCKET" ||
    (err as NodeJS.ErrnoException).code === "SELF_SIGNED_CERT_IN_CHAIN"
  );
}

export function certErrorHelp(): string {
  return (
    "SMTP TLS certificate could not be verified (likely your home network " +
    "ISP/router/AV is intercepting TLS). For DEV ONLY, set SMTP_TLS_REJECT_UNAUTHORIZED=false " +
    "(or NODE_TLS_REJECT_UNAUTHORIZED=0) in .env.local and restart the dev server. " +
    "Production must keep validation enabled."
  );
}
