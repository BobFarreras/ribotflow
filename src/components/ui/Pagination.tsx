/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/ui/Pagination.tsx
 * Description: Professional pagination with page size selector.
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-xs text-[var(--text-muted)]">
        {totalItems > 0 ? `${start}–${end} de ${totalItems}` : "Cap resultat"}
      </div>

      <div className="flex items-center gap-3">
        {/* Page size selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--text-muted)]">Mostrar</span>
          {[25, 50, 100].map((size) => (
            <button
              key={size}
              onClick={() => onPageSizeChange(size)}
              className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors ${
                pageSize === size
                  ? "bg-[var(--module-sat)] text-white"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Page nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--text)] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--text-muted)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[3rem] text-center text-xs text-[var(--text-muted)]">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--text)] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--text-muted)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
