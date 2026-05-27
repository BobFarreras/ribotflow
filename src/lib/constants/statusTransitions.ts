/**
 * Creation/modification date: 27/05/2026
 * Path: src/lib/constants/statusTransitions.ts
 * Description: Shared status transition rules. Used by both server and client.
 */

import type { WorkOrderStatus } from "@/types/sat";

export const VALID_STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  pending: ["assigned", "scheduled", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["paused", "completed", "cancelled", "waiting_parts", "waiting_client"],
  paused: ["in_progress", "cancelled"],
  completed: ["closed", "in_progress"],
  closed: [],
  cancelled: ["pending"],
  waiting_parts: ["in_progress", "cancelled"],
  waiting_client: ["in_progress", "cancelled"],
};

export function isValidTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
