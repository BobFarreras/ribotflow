/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SaveBar.tsx
 * Description: Sticky floating save bar with optional error banner,
 *              dirty counter and a reset button. Stays visible at the
 *              bottom of the viewport while the user scrolls through
 *              long settings forms.
 */

"use client";

import { AlertCircle, Check, Loader2, RotateCcw, Save } from "lucide-react";

interface Props {
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  justSaved: boolean;
  dirtyCount: number;
  onReset: () => void;
  labels: {
    save: string;
    saving: string;
    unsaved: string;
    justSaved: string;
    reset: string;
    change: string;
    changes: string;
  };
}

export function SaveBar({ isDirty, isSaving, saveError, justSaved, dirtyCount, onReset, labels }: Props) {
  if (!isDirty && !saveError && !justSaved) return null;

  return (
    <div className="pointer-events-none sticky bottom-4 z-30 mt-6">
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2">
        {saveError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--danger)] shadow-md"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <span>{saveError}</span>
          </div>
        )}

        <div
          className={
            "flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-[color:var(--surface)]/95 px-4 py-3 shadow-lg backdrop-blur " +
            (saveError
              ? "border-[color:var(--danger)]/40"
              : justSaved
                ? "border-[color:var(--success)]/40"
                : "border-border")
          }
        >
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[color:var(--primary)]" aria-hidden />
                <span className="text-[color:var(--text-muted)]">{labels.saving}</span>
              </>
            ) : saveError ? (
              <span className="text-[color:var(--danger)]">{labels.unsaved}</span>
            ) : justSaved ? (
              <>
                <Check className="h-4 w-4 text-[color:var(--success)]" aria-hidden />
                <span className="text-[color:var(--text-muted)]">{labels.justSaved}</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--primary)]/12 px-1.5 text-xs font-semibold text-[color:var(--primary)]">
                  {dirtyCount}
                </span>
                <span className="text-[color:var(--text-muted)]">
                  {dirtyCount === 1 ? labels.change : labels.changes}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDirty && !isSaving && (
              <button
                type="button"
                onClick={onReset}
                className="btn btn-ghost btn-sm"
                aria-label={labels.reset}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                {labels.reset}
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="btn btn-primary btn-sm"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Save className="h-3.5 w-3.5" aria-hidden />}
              {isSaving ? labels.saving : labels.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
