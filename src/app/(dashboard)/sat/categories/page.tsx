/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/categories/page.tsx
 * Description: Work order category management page.
 */

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { workOrderCategories } from "@/db/schema/sat";
import { eq, asc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Tag, Plus, Star } from "lucide-react";
import { CategoryIcon } from "@/components/sat/CategoryIcon";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.companyId) return null;

  const companyId = session.user.companyId;
  const t = await getTranslations("sat.categories");

  const categoryList = await db
    .select()
    .from(workOrderCategories)
    .where(eq(workOrderCategories.companyId, companyId))
    .orderBy(asc(workOrderCategories.sortOrder));

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--module-sat)]/10 text-[var(--module-sat)]">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text)]">{t("title")}</h1>
              <p className="text-xs text-[var(--text-muted)]">{categoryList.length} categories</p>
            </div>
          </div>
          <Link
            href="/sat/categories/new"
            className="flex items-center gap-1.5 rounded-md bg-[var(--module-sat)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("newButton")}</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {categoryList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] py-16 text-center">
            <Tag className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">{t("emptyState")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryList.map((cat) => (
              <Link
                key={cat.id}
                href={`/sat/categories/${cat.id}`}
                className="group flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition-all hover:border-[var(--module-sat)]/30 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: cat.color ? `${cat.color}20` : undefined }}
                >
                  <CategoryIcon
                    slug={cat.icon ?? cat.slug}
                    color={cat.color}
                    size={24}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--module-sat)]">{cat.name}</h3>
                    {cat.isDefault && (
                      <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        <Star className="h-3 w-3" />
                        Per defecte
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">slug: {cat.slug}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color ?? "#6b7280" }}
                    />
                    <span className="text-xs text-[var(--text-muted)]">{cat.color ?? "Sense color"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
