/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/profile/PasswordChangeForm.tsx
 * Description: Form to change the user's password. Asks for the current
 *              password, the new one, and a confirmation. Submits to
 *              changePasswordAction. The new password is never echoed
 *              back. A "show password" toggle reveals each field.
 */

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { changePasswordAction } from "@/actions/sat/profile/changePassword";

export function PasswordChangeForm() {
  const t = useTranslations("sat.settings.profile");
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const r = await changePasswordAction({
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      if (r.success) {
        setCurrent("");
        setNext("");
        setConfirm("");
        setFeedback({ kind: "ok", msg: t("passwordForm.saved") });
      } else {
        setFeedback({ kind: "err", msg: r.error ?? t("errors.generic") });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasswordField
        id="current"
        label={t("passwordForm.current")}
        value={current}
        onChange={setCurrent}
        shown={showCurrent}
        onToggle={() => setShowCurrent((s) => !s)}
        autoComplete="current-password"
      />
      <PasswordField
        id="next"
        label={t("passwordForm.next")}
        value={next}
        onChange={setNext}
        shown={showNext}
        onToggle={() => setShowNext((s) => !s)}
        autoComplete="new-password"
        hint={t("passwordForm.hint")}
      />
      <PasswordField
        id="confirm"
        label={t("passwordForm.confirm")}
        value={confirm}
        onChange={setConfirm}
        shown={showNext}
        onToggle={() => setShowNext((s) => !s)}
        autoComplete="new-password"
      />

      {feedback && (
        <p
          className={
            "rounded-md border px-3 py-2 text-sm " +
            (feedback.kind === "ok"
              ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5 text-[color:var(--success)]"
              : "border-[color:var(--danger)]/30 bg-[color:var(--danger)]/5 text-[color:var(--danger)]")
          }
        >
          {feedback.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !current || !next || !confirm}
        className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--primary)] px-3.5 py-2 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {t("passwordForm.save")}
      </button>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  shown: boolean;
  onToggle: () => void;
  autoComplete: string;
  hint?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  shown,
  onToggle,
  autoComplete,
  hint,
}: FieldProps) {
  const t = useTranslations("sat.settings.profile");
  return (
    <div>
      <label
        htmlFor={`pwd-${id}`}
        className="mb-1.5 block text-sm font-medium text-[color:var(--text)]"
      >
        {label}
      </label>
      <div className="relative max-w-md">
        <input
          id={`pwd-${id}`}
          type={shown ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 pr-10 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--primary)]"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={shown ? t("passwordForm.hide") : t("passwordForm.show")}
          className="absolute inset-y-0 right-2 flex items-center text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-[color:var(--text-muted)]">{hint}</p>}
    </div>
  );
}
