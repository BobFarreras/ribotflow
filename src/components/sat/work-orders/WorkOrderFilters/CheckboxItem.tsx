/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderFilters/CheckboxItem.tsx
 * Description: Single-row checkbox with optional color dot and icon.
 *              Used inside FilterDropdown for multi-select filters.
 */

"use client";

interface CheckboxItemProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  color?: string | null;
  icon?: React.ReactNode;
}

export function CheckboxItem({ checked, onChange, label, color, icon }: CheckboxItemProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--bg)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-[var(--border)]"
      />
      {icon}
      {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      <span className="text-[var(--text)]">{label}</span>
    </label>
  );
}
