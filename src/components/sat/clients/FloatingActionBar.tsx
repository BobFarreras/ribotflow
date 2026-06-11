/**
 * Creation/modification date: 11/06/2026
 * Path: src/components/sat/clients/FloatingActionBar.tsx
 * Description: Sticky floating action bar with Cancel and Save buttons.
 *              Stays visible at the bottom of the viewport while scrolling.
 */

"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

interface FloatingActionBarProps {
  cancelHref: string;
  cancelLabel: string;
  saveLabel: string;
  isLoading: boolean;
  disabled?: boolean;
}

export function FloatingActionBar({
  cancelHref,
  cancelLabel,
  saveLabel,
  isLoading,
  disabled = false,
}: FloatingActionBarProps) {
  return (
    <div className="pointer-events-none sticky bottom-4 z-30 mt-6">
      <div className="pointer-events-auto mx-auto flex max-w-2xl justify-end gap-3">
        <Link
          href={cancelHref}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2.5 text-sm font-medium text-[var(--text)] shadow-lg backdrop-blur transition-colors hover:bg-[var(--bg)]"
        >
          {cancelLabel}
        </Link>
        <button
          type="submit"
          disabled={disabled || isLoading}
          className="flex items-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
