/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(dashboard)/sat/[id]/_components/WorkOrderDetailQuotesCard.tsx
 * Description: Right-column card showing the latest 3 quotes linked to a work
 *              order, with a "Nou" link to create one and "Veure tots" if more.
 */

import Link from "next/link";
import { FileText, FilePlus } from "lucide-react";
import { QuoteStatusBadge } from "@/components/sat/quotes/QuoteStatusBadge";
import type { QuoteStatus } from "@/lib/constants/statusTransitions";

interface QuoteRow {
  id: string;
  number: string;
  title: string;
  status: string;
  total: string;
}

interface WorkOrderDetailQuotesCardProps {
  workOrderId: string;
  quotes: QuoteRow[];
}

export function WorkOrderDetailQuotesCard({ workOrderId, quotes }: WorkOrderDetailQuotesCardProps) {
  return (
    <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Pressupostos ({quotes.length})
        </h2>
        <Link
          href={`/sat/quotes/new?otId=${workOrderId}`}
          className="flex items-center gap-1 rounded-md bg-[var(--module-sat)]/10 px-2 py-1 text-xs font-medium text-[var(--module-sat)] transition-colors hover:bg-[var(--module-sat)]/20"
        >
          <FilePlus className="h-3 w-3" />
          Nou
        </Link>
      </div>
      {quotes.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <FileText className="h-4 w-4" />
          Sense pressupostos
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.slice(0, 3).map((quote) => (
            <Link
              key={quote.id}
              href={`/sat/quotes/${quote.id}`}
              className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 transition-colors hover:border-[var(--module-sat)]/30"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {quote.number}
                  </span>
                  <QuoteStatusBadge status={quote.status as QuoteStatus} size="sm" />
                </div>
                <div className="mt-0.5 text-xs text-[var(--text)] truncate">{quote.title}</div>
              </div>
              <span className="ml-2 text-sm font-semibold text-[var(--text)]">
                {Number(quote.total).toFixed(2)} €
              </span>
            </Link>
          ))}
          {quotes.length > 3 && (
            <Link
              href="/sat/quotes"
              className="block text-center text-xs text-[var(--module-sat)] hover:underline"
            >
              Veure tots ({quotes.length})
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
