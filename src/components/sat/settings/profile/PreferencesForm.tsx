/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/profile/PreferencesForm.tsx
 * Description: Two inline controls that let the user switch the UI
 *              theme and language. Each click persists the change via
 *              a Server Action that also sets a cookie so the next
 *              request renders with the correct <html lang> / .dark
 *              class (no FOUC).
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Sun, Moon, Check, Loader2 } from "lucide-react";
import { updatePreferencesAction } from "@/actions/sat/profile/updatePreferences";
import type {
  ThemePreference,
  LocalePreference,
} from "@/services/sat/preferences/types";

interface Props {
  initialTheme: ThemePreference;
  initialLocale: LocalePreference;
}

export function PreferencesForm({ initialTheme, initialLocale }: Props) {
  const t = useTranslations("sat.settings.profile.preferences");
  const locale = useLocale();
  const router = useRouter();
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const onChangeTheme = (next: ThemePreference) => {
    if (next === theme) return;
    setTheme(next);
    setFeedback(null);
    startTransition(async () => {
      const r = await updatePreferencesAction({ theme: next });
      if (r.success) {
        setFeedback({ kind: "ok", msg: t("saved") });
      } else {
        setTheme(theme);
        setFeedback({ kind: "err", msg: r.error ?? t("errors.generic") });
      }
    });
  };

  const onChangeLocale = (next: LocalePreference) => {
    if (next === locale) return;
    setFeedback(null);
    startTransition(async () => {
      const r = await updatePreferencesAction({ locale: next });
      if (r.success) {
        setFeedback({ kind: "ok", msg: t("saved") });
        // The cookie is set server-side; a refresh rebuilds the layout
        // so the UI strings appear in the new language.
        router.refresh();
      } else {
        setFeedback({ kind: "err", msg: r.error ?? t("errors.generic") });
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Theme selector */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[color:var(--text)]">{t("theme.label")}</legend>
        <p className="text-xs text-[color:var(--text-muted)]">{t("theme.help")}</p>
        <div className="flex gap-2" role="radiogroup" aria-label={t("theme.label")}>
          <ThemeOption
            current={theme}
            value="light"
            label={t("theme.light")}
            icon={<Sun className="h-4 w-4" aria-hidden />}
            disabled={isPending}
            onClick={onChangeTheme}
          />
          <ThemeOption
            current={theme}
            value="dark"
            label={t("theme.dark")}
            icon={<Moon className="h-4 w-4" aria-hidden />}
            disabled={isPending}
            onClick={onChangeTheme}
          />
        </div>
      </fieldset>

      {/* Locale selector */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[color:var(--text)]">{t("language.label")}</legend>
        <p className="text-xs text-[color:var(--text-muted)]">{t("language.help")}</p>
        <div className="flex gap-2" role="radiogroup" aria-label={t("language.label")}>
          <LocaleOption
            current={locale as LocalePreference}
            value="ca"
            label="Català"
            disabled={isPending}
            onClick={onChangeLocale}
          />
          <LocaleOption
            current={locale as LocalePreference}
            value="es"
            label="Castellano"
            disabled={isPending}
            onClick={onChangeLocale}
          />
        </div>
      </fieldset>

      {/* Feedback */}
      {isPending && (
        <p className="inline-flex items-center gap-1.5 text-xs text-[color:var(--text-muted)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("saving")}
        </p>
      )}
      {feedback && !isPending && (
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
    </div>
  );
}

/* -------------------- subcomponents -------------------- */

function ThemeOption({
  current,
  value,
  label,
  icon,
  disabled,
  onClick,
}: {
  current: ThemePreference;
  value: ThemePreference;
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: (next: ThemePreference) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={() => onClick(value)}
      className={
        "inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 " +
        (active
          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-2)]")
      }
    >
      {icon}
      {label}
      {active && <Check className="h-3.5 w-3.5" aria-hidden />}
    </button>
  );
}

function LocaleOption({
  current,
  value,
  label,
  disabled,
  onClick,
}: {
  current: LocalePreference;
  value: LocalePreference;
  label: string;
  disabled: boolean;
  onClick: (next: LocalePreference) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={() => onClick(value)}
      className={
        "inline-flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 " +
        (active
          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] hover:bg-[color:var(--surface-2)]")
      }
    >
      {label}
      {active && <Check className="h-3.5 w-3.5" aria-hidden />}
    </button>
  );
}
