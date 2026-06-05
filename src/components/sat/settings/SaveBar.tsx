/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SaveBar.tsx
 * Description: Save bar with optional error banner + submit button.
 *              Reused between the company settings form and any future
 *              multi-section save flow. Disables the button when the form
 *              is clean.
 */

"use client";

import { AlertCircle, Save, Loader2 } from "lucide-react";

interface Props {
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  labels: {
    save: string;
    saving: string;
    unsaved: string;
  };
}

export function SaveBar({ isDirty, isSaving, saveError, labels }: Props) {
  return (
    <>
      {saveError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/8 p-3 text-sm text-[color:var(--danger)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          <span>{saveError}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button type="submit" disabled={isSaving || !isDirty} className="btn btn-primary">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {isSaving ? labels.saving : labels.save}
        </button>
        {isDirty && !isSaving && (
          <span className="text-xs text-[color:var(--text-muted)]">{labels.unsaved}</span>
        )}
      </div>
    </>
  );
}
