/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/DashboardShell.tsx
 * Description: Shell wrapper that adapts content area based on sidebar state.
 *              Provides intelligent responsive layout transitions.
 */

"use client";

import { useSidebar } from "./SidebarContext";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileOpen } = useSidebar();

  return (
    <div
      className={`min-h-screen flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isCollapsed
          ? "lg:pl-[72px]"
          : "lg:pl-[260px]"
      } ${isMobileOpen ? "overflow-hidden" : ""}`}
    >
      {children}
    </div>
  );
}
