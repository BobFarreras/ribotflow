/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/Sidebar.tsx
 * Description: Main sidebar component. CSS transitions are ONLY enabled after
 *              hydration (ready=true) to eliminate flash during navigation.
 */

"use client";

import { useTranslations } from "next-intl";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import SidebarNav from "./SidebarNav";
import SidebarFooter from "./SidebarFooter";

function MobileOverlay() {
  const { isMobileOpen, closeMobile } = useSidebar();
  if (!isMobileOpen) return null;
  return (
    <div
      onClick={closeMobile}
      className="fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden"
    />
  );
}

function MobileToggleButton() {
  const { toggleMobile } = useSidebar();
  return (
    <button
      onClick={toggleMobile}
      className="fixed left-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] shadow-sm transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)] lg:hidden"
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}

function SidebarHeader() {
  const { isCollapsed } = useSidebar();
  const t = useTranslations("sidebar");

  return (
    <div className="flex h-14 shrink-0 items-center border-b border-[var(--border)] px-3">
      <a
        href="/dashboard"
        className={`flex items-center gap-2 overflow-hidden whitespace-nowrap ${
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white font-bold text-sm">
          RF
        </div>
        <span className="text-sm font-semibold text-[var(--text)]">{t("brand")}</span>
      </a>

      {isCollapsed && (
        <a
          href="/dashboard"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white font-bold text-sm"
          title={t("brand")}
        >
          RF
        </a>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { isCollapsed, isMobileOpen } = useSidebar();

  return (
    <>
      <MobileOverlay />
      <MobileToggleButton />

        <aside
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-lg ${
          isCollapsed ? "w-[72px]" : "w-[260px]"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <SidebarHeader />
        <SidebarNav />
        <SidebarFooter />
      </aside>
    </>
  );
}
