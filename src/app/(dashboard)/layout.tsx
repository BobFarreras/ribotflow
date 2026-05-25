/**
 * Creation/modification date: 25/05/2026
 * Path: src/app/(dashboard)/layout.tsx
 * Description: Dashboard group layout with professional sidebar, responsive shell,
 *              and intelligent content adaptation.
 */

import { SidebarProvider } from "@/components/layout/SidebarContext";
import Sidebar from "@/components/layout/Sidebar";
import DashboardShell from "@/components/layout/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar />
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
}
