/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/StatusHistorySection.tsx
 * Description: Timeline of work order status changes.
 */

"use client";

import { useTranslations } from "next-intl";

interface StatusHistoryItem {
  id: string;
  statusFrom: string | null;
  statusTo: string;
  reason: string | null;
  createdAt: Date;
}

interface Props {
  history: StatusHistoryItem[];
}

export function StatusHistorySection({ history }: Props) {
  const t = useTranslations("sat.workOrder");

  return (
    <div className="space-y-3">
      {history.map((h) => (
        <div key={h.id} className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--module-sat)]" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text)]">
                {h.statusFrom ? (
                  <>
                    <span className="capitalize">{h.statusFrom}</span>{" "}
                    <span className="text-[var(--text-muted)]">→</span>{" "}
                    <span className="capitalize">{h.statusTo}</span>
                  </>
                ) : (
                  <span className="capitalize">{h.statusTo}</span>
                )}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(h.createdAt).toLocaleString("ca-ES")}
              </span>
            </div>
            {h.reason && (
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{h.reason}</p>
            )}
          </div>
        </div>
      ))}
      {history.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">Sense historial</p>
      )}
    </div>
  );
}
