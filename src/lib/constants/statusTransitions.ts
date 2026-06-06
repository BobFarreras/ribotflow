/**
 * Creation/modification date: 28/05/2026
 * Path: src/lib/constants/statusTransitions.ts
 * Description: Shared status transition rules for work orders and quotes.
 *              Used by both server and client for validation.
 */

import type { WorkOrderStatus } from "@/types/sat";

/* ============================================================
   WORK ORDER STATUS TRANSITIONS (free: any → any)
   ============================================================ */

const ALL_WORK_ORDER_STATUSES: WorkOrderStatus[] = [
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

export const VALID_WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  pending: ALL_WORK_ORDER_STATUSES,
  assigned: ALL_WORK_ORDER_STATUSES,
  scheduled: ALL_WORK_ORDER_STATUSES,
  in_progress: ALL_WORK_ORDER_STATUSES,
  paused: ALL_WORK_ORDER_STATUSES,
  completed: ALL_WORK_ORDER_STATUSES,
  closed: ALL_WORK_ORDER_STATUSES,
  cancelled: ALL_WORK_ORDER_STATUSES,
  waiting_parts: ALL_WORK_ORDER_STATUSES,
  waiting_client: ALL_WORK_ORDER_STATUSES,
};

export function isValidWorkOrderTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return VALID_WORK_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

// Keep backward compatibility
export const VALID_STATUS_TRANSITIONS = VALID_WORK_ORDER_TRANSITIONS;
export const isValidTransition = isValidWorkOrderTransition;

/* ============================================================
   QUOTE STATUS TRANSITIONS
   ============================================================ */

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled";

export const VALID_QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent", "cancelled"],
  sent: ["accepted", "rejected", "cancelled"],
  accepted: [], // Final state
  rejected: ["draft"], // Can revise and resend
  expired: ["draft"], // Can revise and resend
  cancelled: ["draft"], // Can reactivate
};

export function isValidQuoteTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  return VALID_QUOTE_TRANSITIONS[from]?.includes(to) ?? false;
}
