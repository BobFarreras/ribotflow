/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/profile/ActiveSessionsList.tsx
 * Description: Client component that lists the user's active sessions
 *              and lets them revoke individual rows or all others at
 *              once. The current device is identified by a best-effort
 *              fingerprint (user-agent + IP) because Auth.js JWT strategy
 *              does not expose a stable session-token cookie.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Monitor, Smartphone, Tablet, Globe, Loader2, X, Check } from "lucide-react";
import { revokeSessionAction } from "@/actions/sat/profile/revokeSession";
import { revokeAllOtherSessionsAction } from "@/actions/sat/profile/revokeAllOtherSessions";
import type { ActiveSessionDto } from "@/services/sat/sessions/types";

interface SessionFingerprint {
  userAgent: string | null;
  ipAddress: string | null;
}

interface Props {
  sessions: ActiveSessionDto[];
  currentFingerprint: SessionFingerprint;
}

export function ActiveSessionsList({ sessions: rows, currentFingerprint }: Props) {
  const t = useTranslations("sat.settings.profile.sessions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const onRevokeOne = (id: string) => {
    setPendingId(id);
    setFeedback(null);
    startTransition(async () => {
      const r = await revokeSessionAction({ sessionId: id });
      setPendingId(null);
      if (r.success) {
        setFeedback({ kind: "ok", msg: t("feedback.revoked") });
        router.refresh();
      } else {
        setFeedback({ kind: "err", msg: r.error ?? t("errors.generic") });
      }
    });
  };

  const onRevokeOthers = () => {
    setPendingId("__all__");
    setFeedback(null);
    startTransition(async () => {
      const r = await revokeAllOtherSessionsAction();
      setPendingId(null);
      if (r.success) {
        const n = r.data?.revoked ?? 0;
        setFeedback({
          kind: "ok",
          msg: n > 0 ? t("feedback.revokedMany", { count: n }) : t("feedback.revokedNone"),
        });
        router.refresh();
      } else {
        setFeedback({ kind: "err", msg: r.error ?? t("errors.generic") });
      }
    });
  };

  const isCurrentSession = (s: ActiveSessionDto) =>
    s.userAgent === currentFingerprint.userAgent &&
    s.ipAddress === currentFingerprint.ipAddress;

  const hasOthers = rows.some((s) => !isCurrentSession(s));

  return (
    <div className="space-y-4">
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

      {rows.length === 0 ? (
        <p className="text-sm text-[color:var(--text-muted)]">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-[color:var(--border)] rounded-md border border-[color:var(--border)]">
          {rows.map((s) => {
            const current = isCurrentSession(s);
            const deviceLabel = humanizeDevice(s.userAgent);
            return (
              <li key={s.id} className="flex items-start gap-3 px-3 py-3">
                <span className="mt-0.5 text-[color:var(--text-muted)]">
                  {deviceIcon(s.userAgent)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[color:var(--text)]">
                    {deviceLabel}
                    {current && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[color:var(--primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[color:var(--primary)]">
                        <Check className="h-3 w-3" aria-hidden />
                        {t("current")}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                    {t("lastActivity", { when: formatRelative(s.lastUsedAt) })}
                    {s.ipAddress && ` · ${s.ipAddress}`}
                  </p>
                </div>
                {!current && (
                  <button
                    type="button"
                    onClick={() => onRevokeOne(s.id)}
                    disabled={isPending && pendingId === s.id}
                    className="inline-flex items-center gap-1 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--danger)] transition-colors hover:bg-[color:var(--danger)]/5 disabled:opacity-50"
                  >
                    {isPending && pendingId === s.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {t("revoke")}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasOthers && (
        <button
          type="button"
          onClick={onRevokeOthers}
          disabled={isPending && pendingId === "__all__"}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-xs font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)] disabled:opacity-50"
        >
          {isPending && pendingId === "__all__" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : null}
          {t("revokeAllOthers")}
        </button>
      )}
    </div>
  );
}

/* ---------- helpers (pure) ---------- */

function deviceIcon(ua: string | null) {
  if (!ua) return <Globe className="h-4 w-4" aria-hidden />;
  const lower = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(lower)) return <Tablet className="h-4 w-4" aria-hidden />;
  if (/mobile|iphone|android(?!.*tablet)|ipod|blackberry|iemobile|opera mini/.test(lower)) {
    return <Smartphone className="h-4 w-4" aria-hidden />;
  }
  return <Monitor className="h-4 w-4" aria-hidden />;
}

function humanizeDevice(ua: string | null): string {
  if (!ua) return "Dispositiu desconegut";
  const lower = ua.toLowerCase();
  const os = /windows/.test(lower)
    ? "Windows"
    : /mac os x|macintosh/.test(lower)
      ? "macOS"
      : /android/.test(lower)
        ? "Android"
        : /iphone|ipad|ipod/.test(lower)
          ? "iOS"
          : /linux/.test(lower)
            ? "Linux"
            : "Dispositiu";
  const browser = /edg\//.test(lower)
    ? "Edge"
    : /chrome\//.test(lower)
      ? "Chrome"
      : /firefox\//.test(lower)
        ? "Firefox"
        : /safari\//.test(lower)
          ? "Safari"
          : /opera|opr\//.test(lower)
            ? "Opera"
            : "";
  return browser ? `${os} · ${browser}` : os;
}

function formatRelative(d: Date): string {
  const ms = Date.now() - new Date(d).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "ara mateix";
  if (min < 60) return `fa ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `fa ${h} h`;
  const days = Math.round(h / 24);
  return `fa ${days} d`;
}
