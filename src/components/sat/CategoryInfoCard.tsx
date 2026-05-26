/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/CategoryInfoCard.tsx
 * Description: Category information card for the work order detail page.
 */

"use client";

import { useTranslations } from "next-intl";
interface Props {
  category: {
    name: string;
    color: string | null;
  };
}

export function CategoryInfoCard({ category }: Props) {
  const t = useTranslations("sat.workOrder");

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--text)]">
        {t("list.columns.category")}
      </h2>
      <div className="flex items-center gap-2 text-sm text-[var(--text)]">
        {category.color && (
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
        )}
        <span>{category.name}</span>
      </div>
    </div>
  );
}
