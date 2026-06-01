/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderKanban/types.ts
 * Description: Shared types for the Kanban view of work orders.
 */

import type { WorkOrder } from "@/types/sat";

export interface KanbanOrder {
  workOrder: WorkOrder;
  client: { id: string; name: string; phone: string | null; address: string | null };
  category: { id: string; name: string; slug: string; icon: string | null; color: string | null };
  technician: { id: string; name: string } | null;
}
