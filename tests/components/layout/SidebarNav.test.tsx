/**
 * Creation/modification date: 25/05/2026
 * Path: tests/components/layout/SidebarNav.test.tsx
 * Description: Tests for SidebarNav component with navigation items and sub-menus.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
      "sections.main": "Principal",
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
  it("renders main navigation section", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    expect(screen.getByText("Inici")).toBeInTheDocument();
    expect(screen.getByText("SAT")).toBeInTheDocument();
  });

  it("highlights active route", () => {
    mockUsePathname.mockReturnValue("/sat");
    render(
      <SidebarProvider>
        <SidebarNav />
      </SidebarProvider>
    );

    const satLink = screen.getByText("SAT").closest("button");
    expect(satLink).toHaveClass("bg-[var(--primary)]/10");
  });

  it("renders sub-items when section is active", () => {
    mockUsePathname.mockReturnValue("/sat");
    // Pre-expand SAT in localStorage so sub-items render
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
