/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/sat/QuoteStatusBadge.tsx
 * Description: Status badge for quotes with color coding.
 */

"use client";

import type { QuoteStatus } from "@/lib/constants/statusTransitions";

interface Props {
  status: QuoteStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: "Esborrany",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
  },
  sent: {
    label: "Enviat",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  accepted: {
    label: "Acceptat",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
  rejected: {
    label: "Rebutjat",
    color: "text-red-700",
    bgColor: "bg-red-50",
  },
  expired: {
    label: "Caducat",
    color: "text-gray-700",
    bgColor: "bg-gray-50",
  },
  cancelled: {
    label: "Cancel·lat",
    color: "text-gray-700",
    bgColor: "bg-gray-50",
  },
};

export function QuoteStatusBadge({ status, size = "md" }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${config.color} ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      {config.label}
    </span>
  );
}
