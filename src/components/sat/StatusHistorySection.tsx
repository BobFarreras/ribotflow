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
    <div className="space-y-2">
      {history.map((h) => (
        <div key={h.id} className="flex items-start gap-2">
          <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--module-sat)]" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text)]">
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
              <span className="text-[10px] text-[var(--text-muted)]">
                {new Date(h.createdAt).toLocaleString("ca-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {h.reason && (
              <p className="text-[10px] text-[var(--text-muted)]">{h.reason}</p>
            )}
          </div>
        </div>
      ))}
      {history.length === 0 && (
        <p className="text-xs text-[var(--text-muted)]">Sense historial</p>
      )}
    </div>
  );
}
