/**
 * Creation/modification date: 25/05/2026
 * Path: src/app/(dashboard)/layout.tsx
 * Description: Dashboard group layout with professional sidebar, responsive shell,
 *              and intelligent content adaptation. The current user's role is
 *              read once on the server and passed down to the Sidebar so it can
 *              hide navigation items the user is not allowed to see.
 */

import { auth } from "@/lib/auth";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import Sidebar from "@/components/layout/Sidebar";
import DashboardShell from "@/components/layout/DashboardShell";
import { Toaster } from "@/components/ui/Toaster";
import { readThemeCookie } from "@/lib/cookies/preferencesCookies";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userRole = session?.user?.role ?? null;
  const initialTheme = await readThemeCookie();

  return (
    <SidebarProvider initialTheme={initialTheme}>
      <Sidebar userRole={userRole} />
      <DashboardShell>{children}</DashboardShell>
      <Toaster />
    </SidebarProvider>
  );
}
