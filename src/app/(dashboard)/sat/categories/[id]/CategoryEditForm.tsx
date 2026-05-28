/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/categories/[id]/CategoryEditForm.tsx
 * Description: Client form for editing a work order category.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateCategoryAction } from "@/actions/sat/updateCategory";
import { ArrowLeft, Tag, Loader2 } from "lucide-react";
import { ICONS, CategoryIcon } from "@/components/sat/CategoryIcon";

const COLOR_OPTIONS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1",
  "#84cc16", "#f97316",
];

const ICON_SLUGS = Object.keys(ICONS);

interface Props {
  categoryId: string;
  initialData: {
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
    isDefault: boolean;
  };
}

export function CategoryEditForm({ categoryId, initialData }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData.name,
    slug: initialData.slug,
    color: initialData.color || COLOR_OPTIONS[0],
    icon: initialData.icon || ICON_SLUGS[0],
    isDefault: initialData.isDefault,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await updateCategoryAction(categoryId, {
      name: formData.name,
      slug: formData.slug,
      color: formData.color,
      icon: formData.icon,
      isDefault: formData.isDefault,
      sortOrder: 0,
    });

    setIsLoading(false);

    if (result.success) {
      router.push("/sat/categories");
    } else {
      setError(result.error ?? "Error");
    }
  };

  return (
    <div className="flex-1 bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/sat/categories"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-[var(--module-sat)]" />
            <h1 className="text-lg font-semibold text-[var(--text)]">Editar Categoria</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
              required
              pattern="^[a-z0-9_-]+$"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--module-sat)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, color: c }))}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    formData.color === c ? "border-white shadow-md scale-110" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text)]">Icona</label>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
              {ICON_SLUGS.map((slug) => {
                const isActive = formData.icon === slug;
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, icon: slug }))}
                    title={ICONS[slug].label}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                      isActive
                        ? "border-[var(--module-sat)] bg-[var(--module-sat)]/10"
                        : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg)]"
                    }`}
                  >
                    <CategoryIcon
                      slug={slug}
                      color={isActive ? "var(--module-sat)" : "var(--text-muted)"}
                      size={20}
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              Seleccionada: <span className="font-medium text-[var(--text)]">{ICONS[formData.icon]?.label ?? ""}</span>
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData((p) => ({ ...p, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
            <span className="text-sm text-[var(--text)]">Categoria per defecte</span>
            <span className="text-xs text-[var(--text-muted)]">(surt pré-seleccionada en crear OT)</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/sat/categories"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
            >
              Cancel·lar
            </Link>
            <button
              type="submit"
              disabled={isLoading || !formData.name || !formData.slug}
              className="flex items-center gap-2 rounded-lg bg-[var(--module-sat)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Desar canvis
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
