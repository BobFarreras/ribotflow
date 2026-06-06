/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderFilters/constants.ts
 * Description: Static options for status and priority filters.
 *              Single source of truth for the keys/labels/colors used across
 *              WorkOrderFilters, WorkOrderKanban and the workOrderStatusHistory.
 */

export interface StatusOption {
  key: string;
  label: string;
  color: string;
}

export interface PriorityOption {
  key: "low" | "medium" | "high" | "urgent";
  label: string;
  color: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { key: "pending", label: "Pendent", color: "#ca8a04" },
  { key: "assigned", label: "Assignada", color: "#3b82f6" },
  { key: "scheduled", label: "Programada", color: "#8b5cf6" },
  { key: "in_progress", label: "En curs", color: "#10b981" },
  { key: "paused", label: "Pausada", color: "#6b7280" },
  { key: "completed", label: "Completada", color: "#14b8a6" },
  { key: "closed", label: "Tancada", color: "#6366f1" },
  { key: "cancelled", label: "Cancel·lada", color: "#ef4444" },
  { key: "waiting_parts", label: "Esperant peces", color: "#f97316" },
];

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { key: "low", label: "Baixa", color: "#6b7280" },
  { key: "medium", label: "Mitja", color: "#3b82f6" },
  { key: "high", label: "Alta", color: "#f59e0b" },
  { key: "urgent", label: "Urgent", color: "#ef4444" },
];
