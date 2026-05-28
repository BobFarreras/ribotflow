/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderCard.tsx
 * Description: Enhanced grid card for work orders with category icons, distance,
 *              phone, and improved visual hierarchy.
 */

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { WorkOrder } from "@/types/sat";
import { WorkOrderStatusBadge } from "./WorkOrderStatusBadge";
import { WorkOrderPriorityBadge } from "./WorkOrderPriorityBadge";
import { CategoryIcon } from "./CategoryIcon";
import { Phone, MapPin, Calendar, User } from "lucide-react";

interface Props {
  workOrder: WorkOrder;
  client: { name: string; phone: string | null; address: string | null };
  category: { name: string; slug: string; icon: string | null; color: string | null };
  technicianName?: string | null;
}

export function WorkOrderCard({ workOrder, client, category, technicianName }: Props) {
  const t = useTranslations("sat.workOrder");

  return (
    <Link
      href={`/sat/${workOrder.id}`}
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--module-sat)]/30 hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Header: number + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {workOrder.number}
          </span>
          <h3 className="mt-1 text-sm font-semibold leading-tight text-[var(--text)] group-hover:text-[var(--module-sat)]">
            {workOrder.title}
          </h3>
        </div>
        <WorkOrderStatusBadge status={workOrder.status} size="sm" />
      </div>

      {/* Category & Priority */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <CategoryIcon slug={category.icon ?? category.slug} color={category.color} size={12} />
          {category.name}
        </div>
        <WorkOrderPriorityBadge priority={workOrder.priority} />
      </div>

      {/* Client info */}
      <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate font-medium text-[var(--text)]">{client.name}</span>
        </div>
        {client.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.address && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{client.address}</span>
          </div>
        )}
      </div>

      {/* Footer: tech + date + distance */}
      <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3">
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          {technicianName ? (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {technicianName}
            </span>
          ) : (
            <span className="italic opacity-60">Sense assignar</span>
          )}
          {workOrder.travelDistanceKm && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {workOrder.travelDistanceKm} km
            </span>
          )}
        </div>
        {workOrder.scheduledDate && (
          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <Calendar className="h-3 w-3" />
            {new Date(workOrder.scheduledDate).toLocaleDateString("ca-ES", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        )}
      </div>
    </Link>
  );
}
