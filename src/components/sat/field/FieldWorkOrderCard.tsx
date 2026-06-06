/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/field/FieldWorkOrderCard.tsx
 * Description: Mobile-first work-order card for the field list. Shows
 *              number, title, client, priority, scheduled date and
 *              exposes a single tap-target with the next allowed status.
 */

"use client";

import { useTranslations } from "next-intl";
import { Calendar, MapPin, Tag, ChevronRight } from "lucide-react";
import Link from "next/link";
import { WorkOrderStatusBadge } from "@/components/sat/shared/WorkOrderStatusBadge";
import { WorkOrderPriorityBadge } from "@/components/sat/shared/WorkOrderPriorityBadge";
import { FieldStatusActions } from "./FieldStatusActions";
import type { WorkOrder, WorkOrderCategory } from "@/types/sat";

/** Slim view of a client that the card needs. */
interface ClientLite {
  id: string;
  name: string;
}

/** Slim view of a category that the card needs. */
type CategoryLite = Pick<WorkOrderCategory, "id" | "name">;

interface Props {
  workOrder: WorkOrder;
  client: ClientLite;
  category: CategoryLite;
}

export function FieldWorkOrderCard({ workOrder, client, category }: Props) {
  const t = useTranslations("sat.field.card");

  return (
    <article className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
      {/* Header: number + status badge */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <Link
          href={`/sat/${workOrder.id}`}
          className="text-xs font-mono text-[color:var(--text-muted)] hover:underline"
        >
          {workOrder.number}
        </Link>
        <WorkOrderStatusBadge status={workOrder.status} />
      </div>

      {/* Title + meta */}
      <Link href={`/sat/${workOrder.id}`} className="group flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-[color:var(--text)] group-hover:underline">
            {workOrder.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[color:var(--text-muted)]">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            <span className="truncate">{client.name}</span>
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[color:var(--text-muted)]" />
      </Link>

      {/* Chips: priority + category + scheduled date */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <WorkOrderPriorityBadge priority={workOrder.priority} />
        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-xs text-[color:var(--text-muted)]">
          <Tag className="h-3 w-3" aria-hidden />
          {category.name}
        </span>
        {workOrder.scheduledDate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-2)] px-2 py-0.5 text-xs text-[color:var(--text-muted)]">
            <Calendar className="h-3 w-3" aria-hidden />
            {new Date(workOrder.scheduledDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 border-t border-[color:var(--border)] pt-3">
        <FieldStatusActions workOrderId={workOrder.id} status={workOrder.status} />
      </div>
      <p className="sr-only">{t("openDetailsHint")}</p>
    </article>
  );
}
