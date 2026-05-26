/**
 * Creation/modification date: 25/05/2026
 * Path: tests/components/layout/SidebarNav.test.tsx
 * Description: Tests for SidebarNav component with active state classes
 *              and sub-menu visibility.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SidebarNav from "@/components/layout/SidebarNav";
import { SidebarProvider } from "@/components/layout/SidebarContext";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "dashboard.label": "Inici",
      "sat.label": "SAT",
      "sat.subItems.workOrders": "Ordres de Treball",
      "sat.subItems.clients": "Clients",
      "sat.subItems.categories": "Categories",
      "erp.label": "ERP",
      "billing.label": "Facturació",
      "crm.label": "CRM",
      "access.label": "Control d'Accés",
      "settings.label": "Configuració",
    };
    return translations[key] || key;
  },
}));

describe("SidebarNav", () => {
  it("renders main navigation items", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    expect(screen.getByText("Inici")).toBeInTheDocument();
    expect(screen.getByText("SAT")).toBeInTheDocument();
  });

  it("highlights active top-level item", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    const dashboardLink = screen.getByText("Inici").closest("a");
    expect(dashboardLink).toHaveClass("bg-[var(--primary)]/10");
    expect(dashboardLink).toHaveClass("text-[var(--primary)]");
  });

  it("shows sub-items when expanded", () => {
    mockUsePathname.mockReturnValue("/sat");
    localStorage.setItem("sidebar:expanded:sat", "true");

    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    expect(screen.getByText("Ordres de Treball")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();

    localStorage.removeItem("sidebar:expanded:sat");
  });

  it("highlights parent module when child is active", () => {
    mockUsePathname.mockReturnValue("/sat/clients");
    localStorage.setItem("sidebar:expanded:sat", "true");

    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    const satButton = screen.getByText("SAT").closest("button");
    expect(satButton).toHaveClass("bg-[var(--primary)]/10");

    const clientsLink = screen.getByText("Clients").closest("a");
    expect(clientsLink).toHaveClass("bg-[var(--primary)]/10");

    localStorage.removeItem("sidebar:expanded:sat");
  });

  it("sub-menu is always in DOM but hidden when collapsed", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    // SAT is NOT expanded
    localStorage.removeItem("sidebar:expanded:sat");

    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    const satButton = screen.getByText("SAT").closest("button");
    const subMenu = satButton?.parentElement?.querySelector("div[class*='hidden']");
    expect(subMenu).toBeInTheDocument();
  });

  it("renders all modules", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    expect(screen.getByText("ERP")).toBeInTheDocument();
    expect(screen.getByText("Facturació")).toBeInTheDocument();
    expect(screen.getByText("CRM")).toBeInTheDocument();
    expect(screen.getByText("Control d'Accés")).toBeInTheDocument();
    expect(screen.getByText("Configuració")).toBeInTheDocument();
  });

  it("does NOT highlight sibling sub-item on child path (exact match only)", () => {
    mockUsePathname.mockReturnValue("/sat/clients");
    localStorage.setItem("sidebar:expanded:sat", "true");

    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    // Clients should be active
    const clientsLink = screen.getByText("Clients").closest("a");
    expect(clientsLink).toHaveClass("bg-[var(--primary)]/10");

    // WorkOrders (href /sat) should NOT be active on /sat/clients
    const workOrdersLink = screen.getByText("Ordres de Treball").closest("a");
    expect(workOrdersLink).not.toHaveClass("bg-[var(--primary)]/10");

    localStorage.removeItem("sidebar:expanded:sat");
  });

  it("does NOT highlight any sub-item on non-exact child path", () => {
    mockUsePathname.mockReturnValue("/sat/new");
    localStorage.setItem("sidebar:expanded:sat", "true");

    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    const workOrdersLink = screen.getByText("Ordres de Treball").closest("a");
    expect(workOrdersLink).not.toHaveClass("bg-[var(--primary)]/10");

    const clientsLink = screen.getByText("Clients").closest("a");
    expect(clientsLink).not.toHaveClass("bg-[var(--primary)]/10");

    localStorage.removeItem("sidebar:expanded:sat");
  });

  it("shows a tooltip panel with all sub-modules when collapsed on hover", async () => {
    mockUsePathname.mockReturnValue("/sat");
    localStorage.setItem("sidebar:collapsed", "true");

    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    // Find the SAT icon wrapper and hover
    // In collapsed mode, the label is NOT visible as text in nav (only icon)
    const satLink = document.querySelector('[data-nav-target="/sat"]');
    expect(satLink).toBeInTheDocument();

    const user = userEvent.setup();
    await user.hover(satLink!);

    // The tooltip panel should show all sub-items
    expect(await screen.findByText("Ordres de Treball")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();

    localStorage.removeItem("sidebar:collapsed");
  });

  it("sub-modules in collapsed tooltip are clickable links", async () => {
    mockUsePathname.mockReturnValue("/sat");
    localStorage.setItem("sidebar:collapsed", "true");

    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    const satLink = document.querySelector('[data-nav-target="/sat"]');
    const user = userEvent.setup();
    await user.hover(satLink!);

    const clientsLink = await screen.findByText("Clients");
    expect(clientsLink.closest("a")).toHaveAttribute("href", "/sat/clients");

    localStorage.removeItem("sidebar:collapsed");
  });

  it("shows simple tooltip for leaf items when collapsed", async () => {
    mockUsePathname.mockReturnValue("/dashboard");
    localStorage.setItem("sidebar:collapsed", "true");

    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    const dashboardLink = document.querySelector('[data-nav-target="/dashboard"]');
    const user = userEvent.setup();
    await user.hover(dashboardLink!);

    // Simple tooltip with just the module name
    expect(await screen.findByText("Inici")).toBeInTheDocument();

    localStorage.removeItem("sidebar:collapsed");
  });
});
