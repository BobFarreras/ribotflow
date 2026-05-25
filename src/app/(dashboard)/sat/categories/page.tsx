/**
 * Creation/modification date: 25/05/2026
 * Path: src/app/(dashboard)/sat/categories/page.tsx
 * Description: Work order categories page placeholder. Will be implemented in future SAT iterations.
 */

"use client";

import { motion } from "motion/react";
import { Tag, ArrowLeft } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div className="flex-1 bg-[var(--bg)] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <a
          href="/sat"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tornar a SAT
        </a>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--module-sat)]/10 text-[var(--module-sat)]">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">Categories</h1>
            <p className="text-sm text-[var(--text-muted)]">Categories d&apos;ordres de treball</p>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] py-20 text-center">
        <Tag className="mb-4 h-12 w-12 text-[var(--text-muted)]" />
        <h2 className="text-lg font-medium text-[var(--text)]">En desenvolupament</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)] max-w-md">
          Aquesta pàgina es troba en construcció. Formarà part del mòdul SAT complet.
        </p>
      </div>
    </div>
  );
}
