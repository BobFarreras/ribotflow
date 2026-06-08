/**
 * Creation/modification date: 02/06/2026
 * Path: tests/unit/lib/auth/canSeePath.test.ts
 * Description: Tests the path-to-permission map. Every URL exposed in the
 *              SidebarNav should map to a permission; if a future page is
 *              added to the sidebar but forgotten here, it would be
 *              incorrectly accessible.
 */

import { describe, it, expect } from "vitest";
import { requiredPermissionFor, canSeePath } from "@/lib/auth/canSeePath";
import { ROLES } from "@/lib/auth/roles";

describe("requiredPermissionFor", () => {
  it("returns a permission for every gated path", () => {
    const paths = [
      "/settings/company",
      "/settings/email",
      "/settings/team",
      "/settings/profile",
      "/settings/billing",
      "/settings",
      "/sat",
      "/sat/quotes",
      "/sat/quotes/new",
      "/sat/clients",
      "/sat/work-orders",
      "/sat/routes",
      "/sat/map",
      "/sat/categories",
      "/erp",
      "/erp/products",
      "/billing",
      "/billing/invoices",
      "/crm",
      "/crm/contacts",
      "/access",
      "/access/time-tracking",
      "/dashboard",
    ];
    for (const p of paths) {
      expect(requiredPermissionFor(p), `path ${p} not gated`).not.toBeNull();
    }
  });

  it("returns null for unauthenticated public paths", () => {
    expect(requiredPermissionFor("/login")).toBeNull();
    expect(requiredPermissionFor("/register")).toBeNull();
    expect(requiredPermissionFor("/api/auth/session")).toBeNull();
  });

  it("returns null for completely unknown paths (defensive default)", () => {
    expect(requiredPermissionFor("/something/else")).toBeNull();
  });

  it("matches the most specific rule when patterns overlap", () => {
    // /settings/company is more specific than /settings → company:read
    expect(requiredPermissionFor("/settings/company")).toBe("company:read");
    // /settings/team is more specific than /settings → team:read
    expect(requiredPermissionFor("/settings/team")).toBe("team:read");
  });
});

describe("canSeePath", () => {
  it("allows OWNER to see every gated path", () => {
    const paths = [
      "/settings/company",
      "/settings/email",
      "/settings/team",
      "/settings/billing",
      "/sat/quotes",
      "/billing/invoices",
      "/erp/products",
      "/crm/contacts",
    ];
    for (const p of paths) {
      expect(canSeePath("OWNER", p), `OWNER cannot see ${p}`).toBe(true);
    }
  });

  it("blocks TECHNICIAN from billing, quotes and email settings", () => {
    expect(canSeePath("TECHNICIAN", "/settings/billing")).toBe(false);
    expect(canSeePath("TECHNICIAN", "/settings/email")).toBe(false);
    expect(canSeePath("TECHNICIAN", "/settings/team")).toBe(false);
    expect(canSeePath("TECHNICIAN", "/sat/quotes")).toBe(false);
    expect(canSeePath("TECHNICIAN", "/billing/invoices")).toBe(false);
  });

  it("lets TECHNICIAN see /sat (work orders, even if empty), /crm (client data) and /settings/profile", () => {
    expect(canSeePath("TECHNICIAN", "/sat")).toBe(true);
    expect(canSeePath("TECHNICIAN", "/sat/work-orders")).toBe(true);
    expect(canSeePath("TECHNICIAN", "/crm/contacts")).toBe(true);
    expect(canSeePath("TECHNICIAN", "/settings/profile")).toBe(true);
  });

  it("lets OFFICE see clients/quotes/invoices/team, but not work orders or billing settings", () => {
    expect(canSeePath("OFFICE", "/sat/clients")).toBe(true);
    expect(canSeePath("OFFICE", "/sat/quotes")).toBe(true);
    expect(canSeePath("OFFICE", "/billing/invoices")).toBe(true);
    expect(canSeePath("OFFICE", "/settings/team")).toBe(true);
    expect(canSeePath("OFFICE", "/sat/work-orders")).toBe(false);
    expect(canSeePath("OFFICE", "/settings/billing")).toBe(false);
  });

  it("lets ADMIN read company settings but blocks editing it (UI guard)", () => {
    expect(canSeePath("ADMIN", "/settings/company")).toBe(true);
    // ADMIN does not have company:write — the action layer enforces it
    // canSeePath only reflects read access here, not write.
  });

  it("returns true for paths that are not gated (public)", () => {
    for (const role of ROLES) {
      expect(canSeePath(role, "/login")).toBe(true);
    }
  });
});
