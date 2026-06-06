/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/auth/AcceptInvitationForm.tsx
 * Description: Client form for the public /accept-invitation page.
 *              On success the page calls signIn() with the user's
 *              email + the password they just chose, so they land
 *              already authenticated on /dashboard.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { acceptInvitationAction } from "@/actions/sat/team/acceptInvitation";

interface Props {
  token: string;
  invitedEmail: string;
  invitedName: string;
}

export function AcceptInvitationForm({ token, invitedEmail, invitedName }: Props) {
  const t = useTranslations("sat.acceptInvitation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const r = await acceptInvitationAction({ token, password, confirmPassword: confirm });
      if (!r.success) {
        setFeedback({ kind: "err", msg: mapError(r.error ?? "", t) });
        return;
      }
      // Account is active. Auto-login with the credentials the user
      // just chose, then push to /dashboard.
      const signInResult = await signIn("credentials", {
        email: invitedEmail,
        password,
        redirect: false,
      });
      if (signInResult?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setFeedback({ kind: "ok", msg: t("success.signInPending") });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text)]">
        {t("invitedAs", { name: invitedName, email: invitedEmail })}
      </p>

      <div className="space-y-1.5">
        <label htmlFor="ai-password" className="block text-sm font-medium text-[color:var(--text)]">
          {t("fields.password")}
        </label>
        <div className="relative">
          <input
            id="ai-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 pr-10 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--primary)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-2 text-[color:var(--text-muted)]"
            tabIndex={-1}
            aria-label={showPassword ? t("hide") : t("show")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-[color:var(--text-muted)]">{t("fields.hint")}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="ai-confirm" className="block text-sm font-medium text-[color:var(--text)]">
          {t("fields.confirm")}
        </label>
        <input
          id="ai-confirm"
          type={showPassword ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--primary)]"
        />
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
        disabled={isPending || !password || !confirm}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--primary)] px-3.5 py-2 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" aria-hidden />}
        {t("submit")}
      </button>
    </form>
  );
}

function mapError(code: string, t: (k: string) => string): string {
  switch (code) {
    case "INVALID_TOKEN":
      return t("errors.invalidToken");
    case "ALREADY_ACCEPTED":
      return t("errors.alreadyAccepted");
    case "PASSWORD_TOO_SHORT":
      return t("errors.passwordTooShort");
    default:
      return t("errors.generic");
  }
}
