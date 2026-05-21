/**
 * Creation/modification date: 21/05/2026
 * Path: src/app/(dashboard)/dashboard/page.tsx
 * Description: Dashboard home page with module overview and logout functionality.
 */

"use client";

import { motion } from "motion/react";
import {
  Wrench,
  Package,
  FileText,
  Users,
  Clock,
  Settings,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/actions/auth/logout";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const modules = [
  {
    name: "SAT",
    description: "Órdenes de trabajo y asistencia técnica",
    icon: Wrench,
    href: "/dashboard/sat",
    color: "var(--module-sat)",
    bg: "color-mix(in srgb, var(--module-sat) 8%, transparent)",
  },
  {
    name: "ERP",
    description: "Productos, stock y almacenes",
    icon: Package,
    href: "/dashboard/erp",
    color: "var(--module-erp)",
    bg: "color-mix(in srgb, var(--module-erp) 8%, transparent)",
  },
  {
    name: "Facturación",
    description: "Presupuestos, facturas y Veri*factu",
    icon: FileText,
    href: "/dashboard/billing",
    color: "var(--module-billing)",
    bg: "color-mix(in srgb, var(--module-billing) 8%, transparent)",
  },
  {
    name: "CRM",
    description: "Clientes, ventas y oportunidades",
    icon: Users,
    href: "/dashboard/crm",
    color: "var(--module-crm)",
    bg: "color-mix(in srgb, var(--module-crm) 8%, transparent)",
  },
  {
    name: "Control de Acceso",
    description: "Fichaje de jornada y ausencias",
    icon: Clock,
    href: "/dashboard/access",
    color: "var(--module-access)",
    bg: "color-mix(in srgb, var(--module-access) 8%, transparent)",
  },
  {
    name: "Configuración",
    description: "Ajustes de empresa y usuarios",
    icon: Settings,
    href: "/dashboard/settings",
    color: "var(--module-settings)",
    bg: "color-mix(in srgb, var(--module-settings) 8%, transparent)",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--text)]">
            RIBOTFLOW
          </h1>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-[var(--text-muted)]">Dashboard</span>
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--danger)] hover:text-[var(--danger)] disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isPending ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-[var(--text)]">
            Bienvenido a RIBOTFLOW
          </h2>
          <p className="mt-1 text-[var(--text-muted)]">
            Selecciona un módulo para empezar
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod, i) => (
            <motion.a
              key={mod.name}
              href={mod.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all hover:border-[var(--border-strong)] hover:shadow-md"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md transition-transform group-hover:scale-110"
                style={{ backgroundColor: mod.bg, color: mod.color }}
              >
                <mod.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-[var(--text)]">
                {mod.name}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {mod.description}
              </p>
            </motion.a>
          ))}
        </div>
      </main>
    </div>
  );
}
