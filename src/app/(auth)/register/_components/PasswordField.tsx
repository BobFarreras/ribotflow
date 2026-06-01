/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(auth)/register/_components/PasswordField.tsx
 * Description: Password input with show/hide toggle and the password strength
 *              meter. Receives the current password and renders scoring bars
 *              + check list.
 */

"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { passwordStrength } from "../_lib/passwordStrength";

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
}

export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  disabled = false,
  autoComplete = "new-password",
  placeholder,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const strength = passwordStrength(value);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text)]">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-2 pl-10 pr-10 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-label={show ? "Amagar contrasenya" : "Mostrar contrasenya"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all ${strength.color}`}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-muted)]">{strength.label}</span>
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--text-muted)]">
            <li className={value.length >= 8 ? "text-emerald-600" : ""}>8+ caràcters</li>
            <li className={/[A-Z]/.test(value) ? "text-emerald-600" : ""}>Majúscula</li>
            <li className={/[0-9]/.test(value) ? "text-emerald-600" : ""}>Número</li>
            <li className={/[^A-Za-z0-9]/.test(value) ? "text-emerald-600" : ""}>Símbol</li>
          </ul>
        </div>
      )}
    </div>
  );
}
