/**
 * Creation/modification date: 28/05/2026
 * Path: src/app/(dashboard)/sat/quotes/templates/page.tsx
 * Description: Quote templates management page.
 */

import { auth } from "@/lib/auth";
import { quoteTemplateService } from "@/services/sat/quoteTemplateService";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { FolderOpen, Plus, Copy, Pencil, Trash2 } from "lucide-react";

export default async function QuoteTemplatesPage() {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const companyId = session.user.companyId;
  const t = await getTranslations("sat.quotes.templates");

  const templates = await quoteTemplateService.getByCompany(companyId);

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--module-sat)]/10 text-[var(--module-sat)]">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text)]">{t("title")}</h1>
              <p className="text-xs text-[var(--text-muted)]">{templates.length} plantilles</p>
            </div>
          </div>
          <Link
            href="/sat/quotes/templates/new"
            className="flex items-center gap-1.5 rounded-md bg-[var(--module-sat)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("newButton")}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {templates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-center">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">{t("emptyState")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--module-sat)]/30 hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-[var(--text)]">{template.name}</h3>
                {template.description && (
                  <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                  <span>Ús: {template.usageCount} cops</span>
                  <span>•</span>
                  <span>IVA: {Number(template.defaultTaxRate)}%</span>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-3">
                  <Link
                    href={`/sat/quotes/templates/${template.id}`}
                    className="flex items-center gap-1 rounded-md bg-[var(--bg)] px-2 py-1 text-xs font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Link>
                  <Link
                    href={`/sat/quotes/new?templateId=${template.id}`}
                    className="flex items-center gap-1 rounded-md bg-[var(--module-sat)]/10 px-2 py-1 text-xs font-medium text-[var(--module-sat)] transition-colors hover:bg-[var(--module-sat)]/20"
                  >
                    <Copy className="h-3 w-3" />
                    Usar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
