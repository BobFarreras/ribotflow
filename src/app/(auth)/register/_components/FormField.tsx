/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(auth)/register/_components/FormField.tsx
 * Description: Reusable labeled text input with an icon prefix. Used for
 *              companyName, name, email, and confirmPassword fields.
 */

"use client";

import type { LucideIcon } from "lucide-react";

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  disabled?: boolean;
  autoComplete?: string;
}

export function FormField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  disabled = false,
  autoComplete,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-2 pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
