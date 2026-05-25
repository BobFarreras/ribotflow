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
});
