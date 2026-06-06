/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/DashboardShell.tsx
 * Description: Shell wrapper that adapts content area based on sidebar state.
 *              NO transitions — sidebar and content must never animate.
 */

"use client";

import { useSidebar } from "./SidebarContext";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileOpen, ready } = useSidebar();

  const sidebarPadding = ready ? (isCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]") : "lg:pl-[72px]";

  return (
    <div
      className={`min-h-screen flex flex-col ${sidebarPadding} ${isMobileOpen ? "overflow-hidden" : ""}`}
    >
      {children}
    </div>
  );
}
