/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/quotes/QuoteEditorHeader.tsx
 * Description: Toolbar with view switcher, total display and action buttons.
 */

import { Loader2, Edit3, Eye, Send } from "lucide-react";
import type { ExistingQuote } from "./types";

interface Props {
  mode: "create" | "edit";
  existingQuote?: ExistingQuote;
  workOrderId: string;
  view: "split" | "editor" | "preview";
  total: number;
  isLoading: boolean;
  onViewChange: (v: "split" | "editor" | "preview") => void;
  onSubmit: () => void;
  onEmailClick: () => void;
  onCancel: () => void;
}

export function QuoteEditorHeader({
  mode,
  existingQuote,
  workOrderId,
  view,
  total,
  isLoading,
  onViewChange,
  onSubmit,
  onEmailClick,
  onCancel,
}: Props) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
      {/* Left: Title + badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-[var(--text)]">
          {mode === "edit" ? "Editar Pressupost" : "Nou Pressupost"}
        </h1>
        {existingQuote && (
          <span className="rounded bg-[var(--bg)] px-2 py-0.5 text-[11px] font-mono text-[var(--text-muted)]">
            {existingQuote.number}
          </span>
        )}
        {workOrderId && !existingQuote && (
          <span className="rounded bg-[var(--bg)] px-2 py-0.5 text-[11px] font-mono text-[var(--text-muted)]">
            OT
          </span>
        )}
      </div>

      {/* Center: View buttons */}
      <div className="flex items-center gap-1">
        <ViewButton active={view === "split"} onClick={() => onViewChange("split")}>
          Dividida
        </ViewButton>
        <ViewButton active={view === "editor"} onClick={() => onViewChange("editor")} icon={<Edit3 className="mr-1 inline h-3 w-3" />}>
          Editor
        </ViewButton>
        <ViewButton active={view === "preview"} onClick={() => onViewChange("preview")} icon={<Eye className="mr-1 inline h-3 w-3" />}>
          Preview
        </ViewButton>
      </div>

      {/* Right: Total + Actions */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-[11px] text-[var(--text-muted)]">Total</div>
          <div className="text-lg font-bold text-[var(--module-sat)]">
            {total.toFixed(2)} EUR
          </div>
        </div>
        <div className="h-6 w-px bg-[var(--border)]" />
        {mode === "edit" && existingQuote?.status === "draft" && (
          <button
            onClick={onEmailClick}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--module-sat)]/30 bg-[var(--module-sat)]/10 px-3 py-1.5 text-xs font-medium text-[var(--module-sat)] transition-colors hover:bg-[var(--module-sat)]/20"
          >
            <Send className="h-3 w-3" />
            Enviar
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
        >
          Cancel·lar
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--module-sat)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          {mode === "edit" ? "Desar" : "Crear"}
        </button>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
          : "text-[var(--text-muted)] hover:bg-[var(--bg)]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
