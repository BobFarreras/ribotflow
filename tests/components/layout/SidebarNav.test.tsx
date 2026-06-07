/**
 * Creation/modification date: 07/06/2026
 * Path: tests/components/layout/SidebarNav.test.tsx
 * Description: Verifies that the SidebarNav correctly filters navigation
 *              items based on the user's role. Each role should only see
 *              the sections they have permission for.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SidebarNav from "@/components/layout/SidebarNav";
import type { Role } from "@/lib/auth/roles";

vi.mock("next-intl", () => ({
  useTranslations: (ns: string) => {
    const base = {
      "sidebar.modules.dashboard.label": "Inici",
      "sidebar.modules.sat.label": "SAT",
      "sidebar.modules.sat.subItems.workOrders": "Ordres",
      "sidebar.modules.sat.subItems.field": "Camp",
      "sidebar.modules.sat.subItems.quotes": "Pressupostos",
      "sidebar.modules.sat.subItems.quoteTemplates": "Plantilles",
      "sidebar.modules.sat.subItems.map": "Mapa",
      "sidebar.modules.sat.subItems.routes": "Rutes",
      "sidebar.modules.sat.subItems.clients": "Clients",
      "sidebar.modules.sat.subItems.categories": "Categories",
      "sidebar.modules.erp.label": "ERP",
      "sidebar.modules.erp.subItems.products": "Productes",
      "sidebar.modules.erp.subItems.inventory": "Inventari",
      "sidebar.modules.billing.label": "Facturació",
      "sidebar.modules.billing.subItems.invoices": "Factures",
      "sidebar.modules.billing.subItems.budgets": "Pressupostos",
      "sidebar.modules.crm.label": "CRM",
      "sidebar.modules.crm.subItems.contacts": "Contactes",
      "sidebar.modules.crm.subItems.opportunities": "Oportunitats",
      "sidebar.modules.access.label": "Control d'Accés",
      "sidebar.modules.access.subItems.timeTracking": "Fichatge",
      "sidebar.modules.access.subItems.absences": "Absències",
      "sidebar.modules.settings.label": "Configuració",
      "sidebar.modules.settings.subItems.company": "Empresa",
      "sidebar.modules.settings.subItems.email": "Correu",
      "sidebar.modules.settings.subItems.team": "Equip",
      "sidebar.modules.settings.subItems.profile": "Perfil",
    };
    return (key: string, vars?: Record<string, unknown>) => {
      const fullKey = `${ns}.${key}`;
      return (
        base[fullKey as keyof typeof base] ??
        (typeof vars === "object" && vars !== null
          ? `${fullKey} (${JSON.stringify(vars)})`
          : fullKey)
      );
    };
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/components/layout/SidebarContext", () => ({
  useSidebar: () => ({ expandedKeys: new Set(), toggleExpanded: () => {} }),
}));

/**
 * Helper: renders the nav for a given role and returns the visible
 * text content of every link/button in the navigation.
 */
function getVisibleLabels(role: Role | null) {
  const { container } = render(<SidebarNav userRole={role} />);
  const items = Array.from(container.querySelectorAll("nav a, nav button"));
  return items.map((el) => el.textContent?.trim() ?? "").filter(Boolean);
}

describe("SidebarNav — role filtering", () => {
  it("OWNER sees every module", () => {
    const labels = getVisibleLabels("OWNER");
    expect(labels).toContain("Inici");
    expect(labels).toContain("SAT");
    expect(labels).toContain("Configuració");
    expect(labels).toContain("Empresa");
    expect(labels).toContain("Correu");
    expect(labels).toContain("Equip");
    expect(labels).toContain("Perfil");
  });

  it("ADMIN sees SAT, Settings (company, email, team, profile)", () => {
    const labels = getVisibleLabels("ADMIN");
    expect(labels).toContain("Inici");
    expect(labels).toContain("SAT");
    expect(labels).toContain("Configuració");
    expect(labels).toContain("Empresa");
    expect(labels).toContain("Correu"); // ADMIN has email:read
    expect(labels).toContain("Equip");
    expect(labels).toContain("Perfil");
  });

  it("OFFICE sees SAT (read-only), Clients, Quotes, Settings (company, team, profile)", () => {
    const labels = getVisibleLabels("OFFICE");
    expect(labels).toContain("Inici");
    expect(labels).toContain("SAT");
    expect(labels).toContain("Clients");
    expect(labels).toContain("Pressupostos");
    expect(labels).toContain("Configuració"); // has company:read + team:read + profile:read:self
    expect(labels).toContain("Empresa");
    expect(labels).toContain("Equip"); // OFFICE has team:read
    expect(labels).toContain("Perfil");
    expect(labels).not.toContain("Correu"); // OFFICE lacks email:read
  });

  it("TECHNICIAN sees SAT, /sat/field, Clients, Materials, Settings (company+profile)", () => {
    const labels = getVisibleLabels("TECHNICIAN");
    expect(labels).toContain("Inici");
    expect(labels).toContain("SAT");
    expect(labels).toContain("Camp");
    expect(labels).toContain("Clients");
    expect(labels).toContain("Configuració"); // has company:read + profile:read:self
    expect(labels).toContain("Empresa");
    expect(labels).toContain("Perfil");
    expect(labels).not.toContain("Correu"); // no email:read
    expect(labels).not.toContain("Equip"); // no team:read
    expect(labels).not.toContain("Pressupostos"); // no quote:read
  });

  it("signed-out user (role=null) sees nothing gated", () => {
    const labels = getVisibleLabels(null);
    expect(labels).toHaveLength(0);
  });

  it("undefined role shows every item (SSR fallback / tests)", () => {
    const labels = getVisibleLabels(undefined);
    expect(labels).toContain("Inici");
    expect(labels).toContain("SAT");
    expect(labels).toContain("Configuració");
    expect(labels).toContain("Correu");
    expect(labels).toContain("Equip");
  });
});
