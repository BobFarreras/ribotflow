/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderFilters/ViewSwitcher.tsx
 * Description: Three-button toggle (grid/table/kanban) bound to ?view= URL param.
 */

"use client";

import { LayoutGrid, Table2, Columns3 } from "lucide-react";

export type WorkOrderView = "grid" | "table" | "kanban";

interface ViewSwitcherProps {
  currentView: WorkOrderView;
  onChange: (view: WorkOrderView) => void;
}

const OPTIONS: Array<{ key: WorkOrderView; icon: React.ReactNode; title: string }> = [
  { key: "grid", icon: <LayoutGrid className="h-3.5 w-3.5" />, title: "Caixes" },
  { key: "table", icon: <Table2 className="h-3.5 w-3.5" />, title: "Taula" },
  { key: "kanban", icon: <Columns3 className="h-3.5 w-3.5" />, title: "Kanban" },
];

export function ViewSwitcher({ currentView, onChange }: ViewSwitcherProps) {
  return (
    <div className="ml-auto flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-md p-1.5 transition-colors ${
            currentView === opt.key
              ? "bg-[var(--module-sat)] text-white"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
          title={opt.title}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}
