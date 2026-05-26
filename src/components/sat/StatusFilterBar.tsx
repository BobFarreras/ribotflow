/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/StatusFilterBar.tsx
 * Description: Horizontal status filter pills for the work order list.
 */

"use client";

import Link from "next/link";
import { Filter } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WorkOrderStatus } from "@/types/sat";

const STATUS_KEYS: (WorkOrderStatus | "all")[] = [
  "all",
  "pending",
  "assigned",
  "in_progress",
  "paused",
  "completed",
  "closed",
  "cancelled",
];

interface Props {
  activeStatus?: string;
}

export function StatusFilterBar({ activeStatus }: Props) {
  const t = useTranslations("sat.workOrder");
  const current = activeStatus ?? "all";

  return (
    <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
      <Filter className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
      {STATUS_KEYS.map((key) => (
        <Link
          key={key}
          href={key === "all" ? "/sat" : `/sat?status=${key}`}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            current === key
              ? "border-[var(--module-sat)] bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
          }`}
        >
          {t(`list.status.${key}`)}
        </Link>
      ))}
    </div>
  );
}
