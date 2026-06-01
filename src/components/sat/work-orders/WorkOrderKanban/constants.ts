/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderKanban/constants.ts
 * Description: Column metadata for the Kanban board.
 *              Status keys here MUST match the workflow transitions
 *              defined in @/lib/constants/statusTransitions.
 */

export interface KanbanColumn {
  key: string;
  label: string;
  short: string;
  color: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  { key: "pending", label: "Pendent", short: "P", color: "#ca8a04" },
  { key: "assigned", label: "Assignada", short: "A", color: "#3b82f6" },
  { key: "scheduled", label: "Programada", short: "Pr", color: "#8b5cf6" },
  { key: "in_progress", label: "En curs", short: "C", color: "#10b981" },
  { key: "paused", label: "Pausada", short: "Pa", color: "#6b7280" },
  { key: "completed", label: "Completada", short: "Co", color: "#14b8a6" },
  { key: "closed", label: "Tancada", short: "T", color: "#6366f1" },
  { key: "cancelled", label: "Cancel·lada", short: "X", color: "#ef4444" },
];

export const ALWAYS_VISIBLE_COLUMNS = ["pending", "assigned", "in_progress", "completed"];
