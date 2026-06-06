/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/team/InviteUserForm.tsx
 * Description: Client form used by the team page to invite a new user.
 *              Calls inviteUserAction, displays the new invitation URL in
 *              dev mode so the developer can copy/paste it, and refreshes
 *              the team list on success.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Copy, Check, X } from "lucide-react";
import { inviteUserAction } from "@/actions/sat/team/inviteUser";

interface Props {
  onClose: () => void;
}

export function InviteUserForm({ onClose }: Props) {
  const router = useRouter();
  const t = useTranslations("sat.settings.team.invite");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TECHNICIAN" | "OFFICE">("TECHNICIAN");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInvitationUrl(null);
    startTransition(async () => {
      const result = await inviteUserAction({ name, email, role });
      if (!result.success) {
        setError(result.error ?? t("errors.generic"));
        return;
      }
      setInvitationUrl(result.invitationUrl ?? null);
      router.refresh();
    });
  };

  const onCopy = async () => {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard rejected — user can copy manually
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--text)]">
                {t("title")}
              </h2>
              <p className="text-sm text-[color:var(--text-muted)]">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label={t("close")}
            className="rounded-md p-1.5 text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {invitationUrl ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[color:var(--success)]/30 bg-[color:var(--success)]/5 p-3 text-sm text-[color:var(--text)]">
              {t("successDev")}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[color:var(--text-muted)]">
                {t("invitationUrl")}
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  readOnly
                  value={invitationUrl}
                  className="flex-1 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-xs text-[color:var(--text)]"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)]"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[color:var(--success)]" />
                      {t("copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      {t("copy")}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90"
              >
                {t("done")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="invite-name" className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
                {t("name")}
              </label>
              <input
                id="invite-name"
                type="text"
                required
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--primary)]"
              />
            </div>
            <div>
              <label htmlFor="invite-email" className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
                {t("email")}
              </label>
              <input
                id="invite-email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text)] outline-none focus:border-[color:var(--primary)]"
              />
            </div>
            <fieldset>
              <legend className="mb-1.5 block text-sm font-medium text-[color:var(--text)]">
                {t("role")}
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(["ADMIN", "TECHNICIAN", "OFFICE"] as const).map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer flex-col items-start gap-1 rounded-md border p-3 text-sm transition-colors ${
                      role === r
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5"
                        : "border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-[color:var(--primary)]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="sr-only"
                    />
                    <span className="font-medium text-[color:var(--text)]">
                      {t(`roles.${r}.label`)}
                    </span>
                    <span className="text-xs text-[color:var(--text-muted)]">
                      {t(`roles.${r}.hint`)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && (
              <p className="rounded-md border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/5 px-3 py-2 text-sm text-[color:var(--danger)]">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)]"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? t("submitting") : t("submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
