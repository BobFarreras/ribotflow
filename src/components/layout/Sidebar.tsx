/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/Sidebar.tsx
 * Description: Main sidebar component with header, navigation, and footer.
 *              Collapsible, responsive, and animated.
 */

"use client";

import { motion, AnimatePresence } from "motion/react";
import { PanelLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSidebar } from "./SidebarContext";
import SidebarNav from "./SidebarNav";
import SidebarFooter from "./SidebarFooter";

function SidebarHeader() {
  const { isCollapsed } = useSidebar();
  const t = useTranslations("sidebar");

  return (
    <div className="flex h-14 items-center border-b border-[var(--border)] px-3">
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.a
            href="/dashboard"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white font-bold text-sm">
              RF
            </div>
            <span className="text-sm font-semibold text-[var(--text)]">{t("brand")}</span>
          </motion.a>
        )}
      </AnimatePresence>

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

function MobileOverlay() {
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}
    </AnimatePresence>
  );
}

export default function Sidebar() {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Mobile Overlay */}
      <MobileOverlay />

      {/* Mobile Toggle Button (visible when sidebar closed) */}
      <MobileToggleButton />

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 72 : 260,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-lg ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-[72px]" : "w-[260px]"}`}
      >
        <SidebarHeader />
        <SidebarNav />
        <SidebarFooter />
      </motion.aside>
    </>
  );
}
