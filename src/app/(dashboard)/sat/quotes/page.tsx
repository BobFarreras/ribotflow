/**
 * Creation/modification date: 28/05/2026
 * Path: src/app/(dashboard)/sat/quotes/page.tsx
 * Description: Quote management page with list, filters, and stats.
 */

import { auth } from "@/lib/auth";
import { quoteService } from "@/services/sat/quoteService";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { FileText, Plus, Clock, CheckCircle, XCircle, Send, AlertCircle } from "lucide-react";
import { QuoteList } from "@/components/sat/quotes/QuoteList";

export default async function QuotesPage() {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const companyId = session.user.companyId;
  const t = await getTranslations("sat.quotes");

  const quotes = await quoteService.getByCompany(companyId);
  const stats = await quoteService.getStats(companyId);

  return (
    <div className="flex h-[calc(100dvh-1px)] flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--module-sat)]/10 text-[var(--module-sat)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text)]">{t("title")}</h1>
              <p className="text-xs text-[var(--text-muted)]">{quotes.length} pressupostos</p>
            </div>
          </div>
          <Link
            href="/sat/quotes/new"
            className="flex items-center gap-1.5 rounded-md bg-[var(--module-sat)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("newButton")}</span>
          </Link>
        </div>
      </header>

      {/* Stats bar */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto">
          <StatCard
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            label="Esborranys"
            value={stats.byStatus.draft ?? 0}
          />
          <StatCard
            icon={<Send className="h-4 w-4 text-blue-500" />}
            label="Enviats"
            value={stats.byStatus.sent ?? 0}
          />
          <StatCard
            icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
            label="Acceptats"
            value={stats.byStatus.accepted ?? 0}
          />
          <StatCard
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            label="Rebutjats"
            value={stats.byStatus.rejected ?? 0}
          />
          <StatCard
            icon={<AlertCircle className="h-4 w-4 text-gray-500" />}
            label="Caducats"
            value={stats.byStatus.expired ?? 0}
          />
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6">
        <QuoteList quotes={quotes} />
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
      {icon}
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--text)]">{value}</span>
    </div>
  );
}
