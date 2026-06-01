/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/ui/FormPrimitives.tsx
 * Description: Shared collapsible section, input and textarea primitives
 *              for quote editor forms.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Section({
  title,
  children,
  action,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
        <div className="flex items-center gap-2">
          {action && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
          <ChevronDown
            className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
      />
    </div>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
      />
    </div>
  );
}
