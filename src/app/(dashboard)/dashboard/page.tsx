/**
 * Creation/modification date: 25/05/2026
 * Path: src/app/(dashboard)/dashboard/page.tsx
 * Description: Dashboard home page template. Displays module overview cards.
 *              Will be expanded with widgets and analytics in future iterations.
 */

"use client";

import { motion } from "motion/react";
import { Wrench, Package, FileText, Users, Clock, Settings } from "lucide-react";
import { useTranslations } from "next-intl";

const modules = [
  { key: "sat", icon: Wrench, color: "var(--module-sat)", href: "/sat" },
  { key: "erp", icon: Package, color: "var(--module-erp)", href: "/erp" },
  { key: "billing", icon: FileText, color: "var(--module-billing)", href: "/billing" },
  { key: "crm", icon: Users, color: "var(--module-crm)", href: "/crm" },
  { key: "access", icon: Clock, color: "var(--module-access)", href: "/access" },
  { key: "settings", icon: Settings, color: "var(--module-settings)", href: "/settings" },
];

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <div className="flex-1 bg-[var(--bg)] p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-semibold text-[var(--text)]">{t("title")}</h1>
        <p className="mt-1 text-[var(--text-muted)]">{t("subtitle")}</p>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod, i) => (
          <motion.a
            key={mod.key}
            href={mod.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all hover:border-[var(--border-strong)] hover:shadow-md"
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
              style={{
                backgroundColor: `color-mix(in srgb, ${mod.color} 10%, transparent)`,
                color: mod.color,
              }}
            >
              <mod.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">
              {t(`modules.${mod.key}.title`)}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t(`modules.${mod.key}.description`)}
            </p>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
