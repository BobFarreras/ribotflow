/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/StatusPill.tsx
 * Description: Compact status pill for the company settings page
 *              header. Shows a single line: "Actiu · Actualitzat el …"
 *              with a coloured dot. Used in place of the more verbose
 *              SmtpStatusBadge when only a quick at-a-glance signal
 *              is needed.
 */

import { CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  configured: boolean;
  lastUpdated?: Date | string | null;
  labels: {
    active: string;
    inactive: string;
    updatedAt: string;
  };
}

export function StatusPill({ configured, lastUpdated, labels }: Props) {
  const updated = lastUpdated ? new Date(lastUpdated).toLocaleString() : null;
  return (
    <div
      className={
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm " +
        (configured
          ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/8 text-[color:var(--success)]"
          : "border-[color:var(--warning)]/30 bg-[color:var(--warning)]/8 text-[color:var(--warning)]")
      }
    >
      {configured ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden />
      ) : (
        <AlertCircle className="h-4 w-4" aria-hidden />
      )}
      <span className="font-semibold">{configured ? labels.active : labels.inactive}</span>
      {updated && (
        <>
          <span className="text-[color:var(--text-muted)]" aria-hidden>
            ·
          </span>
          <span className="text-[color:var(--text-muted)]">
            {labels.updatedAt} {updated}
          </span>
        </>
      )}
    </div>
  );
}
