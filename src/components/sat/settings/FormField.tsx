/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/FormField.tsx
 * Description: Small labeled form field wrapper used by SmtpSettingsForm.
 *              - label: visible label (semantic, tied to the input via nesting).
 *              - hint: muted help text below the input.
 *              - error: replaces hint and tints the input red.
 *              - children: the actual input/select/textarea.
 */

import type { ReactNode } from "react";

export function FormField({
  label,
  hint,
  error,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className={"label" + (required ? " label-required" : "")}>{label}</label>
      {children}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="field-hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function FormCheckbox({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="space-y-0">
        <span className="block">{label}</span>
        {hint && <span className="block text-xs text-[color:var(--text-muted)]">{hint}</span>}
      </span>
    </label>
  );
}
