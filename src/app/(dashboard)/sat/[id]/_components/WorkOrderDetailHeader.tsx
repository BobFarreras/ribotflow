/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(dashboard)/sat/[id]/_components/WorkOrderDetailHeader.tsx
 * Description: Top header bar with back button, OT number, title, and badges.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WorkOrderPriorityBadge } from "@/components/sat/shared/WorkOrderPriorityBadge";
import { WorkOrderStatusBadge } from "@/components/sat/shared/WorkOrderStatusBadge";

interface WorkOrderDetailHeaderProps {
  number: string;
  title: string;
  priority: string;
  status: string;
}

export function WorkOrderDetailHeader({ number, title, priority, status }: WorkOrderDetailHeaderProps) {
  return (
    <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/sat"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-xs font-mono font-medium text-[var(--text-muted)]">
              {number}
            </span>
            <h1 className="text-lg font-semibold text-[var(--text)]">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WorkOrderPriorityBadge priority={priority as any} />
          <WorkOrderStatusBadge status={status as any} size="sm" />
        </div>
      </div>
    </header>
  );
}
