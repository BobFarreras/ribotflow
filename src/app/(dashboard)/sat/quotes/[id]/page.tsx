/**
 * Creation/modification date: 28/05/2026
 * Path: src/app/(dashboard)/sat/quotes/[id]/page.tsx
 * Description: Quote detail page with items, status, and actions.
 */

import { auth } from "@/lib/auth";
import { quoteService } from "@/services/sat/quoteService";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Send, CheckCircle, XCircle, Download, Trash2 } from "lucide-react";
import { QuoteStatusBadge } from "@/components/sat/QuoteStatusBadge";
import { QuoteItemTable } from "@/components/sat/QuoteItemTable";
import { QuoteActions } from "@/components/sat/QuoteActions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const { id } = await params;
  const companyId = session.user.companyId;

  const quote = await quoteService.getById(companyId, id);
  if (!quote) notFound();

  const history = await quoteService.getStatusHistory(id);

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/sat/quotes"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-xs font-mono font-medium text-[var(--text-muted)]">
                {quote.number}
              </span>
              <h1 className="text-lg font-semibold text-[var(--text)]">{quote.title}</h1>
            </div>
          </div>
          <QuoteStatusBadge status={quote.status as any} />
        </div>
      </header>

      {/* Info strip */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-2">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
          <span>
            <Link href={`/sat/${quote.workOrderId}`} className="hover:text-[var(--module-sat)] hover:underline">
              OT relacionada
            </Link>
          </span>
          {quote.validUntil && (
            <span>Vàlid fins al {new Date(quote.validUntil).toLocaleDateString("ca-ES")}</span>
          )}
          <span>
            Creat el {new Date(quote.createdAt).toLocaleDateString("ca-ES")}
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-3 px-4 py-3">
        {/* Left: Items */}
        <div className="flex min-h-0 w-[65%] flex-col gap-3">
          <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Línies del Pressupost
            </h2>
            <div className="min-h-0 overflow-y-auto">
              <QuoteItemTable items={quote.items} quoteStatus={quote.status} quoteId={quote.id} />
            </div>
          </div>
        </div>

        {/* Right: Summary + Actions */}
        <div className="flex min-h-0 w-[35%] flex-col gap-3">
          {/* Totals */}
          <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Resum
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Base imposable</span>
                <span className="font-medium text-[var(--text)]">{Number(quote.subtotal).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">IVA ({quote.taxRate}%)</span>
                <span className="font-medium text-[var(--text)]">{Number(quote.taxAmount).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border)] pt-2 text-base font-bold">
                <span className="text-[var(--text)]">Total</span>
                <span className="text-[var(--module-sat)]">{Number(quote.total).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Accions
            </h2>
            <QuoteActions quote={quote} />
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Notes internes
              </h2>
              <p className="text-sm text-[var(--text)]">{quote.notes}</p>
            </div>
          )}

          {quote.clientNotes && (
            <div className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Notes per al client
              </h2>
              <p className="text-sm text-[var(--text)]">{quote.clientNotes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
