/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/sat/QuoteList.tsx
 * Description: Client component for displaying quotes with filters and pagination.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { Search, Filter, Calendar, User, FileText, ChevronRight } from "lucide-react";

interface Quote {
  id: string;
  number: string;
  title: string;
  status: string;
  total: string;
  clientId: string;
  workOrderId: string | null;
  createdAt: Date;
  validUntil: Date | null;
  sentAt: Date | null;
  acceptedAt: Date | null;
}

interface Props {
  quotes: Quote[];
}

export function QuoteList({ quotes }: Props) {
  const t = useTranslations("sat.quotes");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return quotes.filter((quote) => {
      // Search filter
      if (search) {
        const haystack = [quote.number, quote.title].join(" ").toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }

      // Status filter
      if (statusFilter !== "all" && quote.status !== statusFilter) return false;

      return true;
    });
  }, [quotes, search, statusFilter]);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cercar per número o títol..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
        >
          <option value="all">Tots els estats</option>
          <option value="draft">Esborrany</option>
          <option value="sent">Enviat</option>
          <option value="accepted">Acceptat</option>
          <option value="rejected">Rebutjat</option>
          <option value="expired">Caducat</option>
          <option value="cancelled">Cancel·lat</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]">
          <div className="text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">
              {quotes.length === 0 ? "No hi ha pressupostos" : "Cap resultat amb els filtres"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((quote) => (
            <Link
              key={quote.id}
              href={`/sat/quotes/${quote.id}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--module-sat)]/30 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {quote.number}
                  </span>
                  <h3 className="mt-1 text-sm font-semibold leading-tight text-[var(--text)] group-hover:text-[var(--module-sat)]">
                    {quote.title}
                  </h3>
                </div>
                <QuoteStatusBadge status={quote.status as any} size="sm" />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-[var(--text)]">
                  {Number(quote.total).toFixed(2)} €
                </span>
                {quote.validUntil && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Fins al {new Date(quote.validUntil).toLocaleDateString("ca-ES")}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-[11px] text-[var(--text-muted)]">
                  {new Date(quote.createdAt).toLocaleDateString("ca-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--module-sat)]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
