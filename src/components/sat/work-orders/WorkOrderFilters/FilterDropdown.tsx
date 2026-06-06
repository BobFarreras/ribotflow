/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderFilters/FilterDropdown.tsx
 * Description: Reusable dropdown button with active-count badge and portal-style
 *              content panel. Used by every filter category in WorkOrderFilters.
 */

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FilterDropdownProps {
  label: string;
  icon?: React.ReactNode;
  activeCount?: number;
  children: React.ReactNode;
}

export function FilterDropdown({ label, icon, activeCount, children }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          activeCount
            ? "border-[var(--module-sat)]/30 bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        }`}
      >
        {icon}
        <span>{label}</span>
        {activeCount ? (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--module-sat)] px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
