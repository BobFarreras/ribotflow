/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/DashboardShell.tsx
 * Description: Shell wrapper that adapts content area based on sidebar state.
 *              Starts with minimum padding (72px) to avoid flash during hydration.
 */

"use client";

import { useSidebar } from "./SidebarContext";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileOpen, ready } = useSidebar();

  // Before hydration: always use minimum padding (72px) so content never jumps
  // After hydration: use correct padding based on collapsed state
  const sidebarPadding = ready
    ? isCollapsed
      ? "lg:pl-[72px]"
      : "lg:pl-[260px]"
    : "lg:pl-[72px]";

  return (
    <div
      className={`min-h-screen flex flex-col ${
        ready ? "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" : ""
      } ${sidebarPadding} ${isMobileOpen ? "overflow-hidden" : ""}`}
    >
      {children}
    </div>
  );
}
