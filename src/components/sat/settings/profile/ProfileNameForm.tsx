/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/profile/ProfileNameForm.tsx
 * Description: Lets the user edit their own name. Submits to
 *              updateProfileNameAction. Email is read-only (it is the
 *              account identifier and is changed through a separate flow
 *              — out of scope for this PR).
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Save, Loader2, Check } from "lucide-react";
import { updateProfileNameAction } from "@/actions/sat/profile/updateProfile";

interface Props {
  initialName: string;
  initialEmail: string;
}

export function ProfileNameForm({ initialName, initialEmail }: Props) {
  const t = useTranslations("sat.settings.profile");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const dirty = name.trim() !== initialName;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setFeedback(null);
    startTransition(async () => {
      const r = await updateProfileNameAction({ name: name.trim() });
      if (r.success) {
        setFeedback({ kind: "ok", msg: t("nameForm.saved") });
        router.refresh();
      } else {
        setFeedback({ kind: "err", msg: r.error ?? t("errors.generic") });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
          {t("nameForm.name")}
        </label>
        <input
          id="profile-name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className="w-full max-w-md rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--primary)]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[color:var(--text-muted)]">
          {t("nameForm.email")}
        </label>
        <input
          type="email"
          readOnly
          value={initialEmail}
          className="w-full max-w-md rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text-muted)]"
        />
        <p className="mt-1.5 text-xs text-[color:var(--text-muted)]">
          {t("nameForm.emailHint")}
        </p>
      </div>

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
        disabled={!dirty || isPending}
        className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--primary)] px-3.5 py-2 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {t("nameForm.save")}
      </button>
    </form>
  );
}
