/**
 * Creation/modification date: 27/05/2026
 * Path: src/lib/constants/statusTransitions.ts
 * Description: Shared status transition rules. Used by both server and client.
 */

import type { WorkOrderStatus } from "@/types/sat";

const ALL_STATUSES: WorkOrderStatus[] = [
  "pending",
  "assigned",
  "scheduled",
  "in_progress",
  "paused",
  "completed",
  "closed",
  "cancelled",
  "waiting_parts",
  "waiting_client",
];

export const VALID_STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  pending: ALL_STATUSES,
  assigned: ALL_STATUSES,
  scheduled: ALL_STATUSES,
  in_progress: ALL_STATUSES,
  paused: ALL_STATUSES,
  completed: ALL_STATUSES,
  closed: ALL_STATUSES,
  cancelled: ALL_STATUSES,
  waiting_parts: ALL_STATUSES,
  waiting_client: ALL_STATUSES,
};

export function isValidTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
