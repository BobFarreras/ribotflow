/**
 * Creation/modification date: 02/06/2026
 * Path: tests/unit/lib/auth/permissions.test.ts
 * Description: Exhaustive test of the role/permission matrix. The matrix is
 *              the single source of truth for "who can do what" — if these
 *              tests pass, every Server Action and UI guard that calls
 *              can() will agree with the matrix.
 */

import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  can,
  canAny,
  canAll,
} from "@/lib/auth/permissions";
import { ROLES, type Role } from "@/lib/auth/roles";

describe("roles/permissions matrix", () => {
  it("declares exactly 4 roles", () => {
    expect(ROLES).toEqual(["OWNER", "ADMIN", "OFFICE", "TECHNICIAN"]);
  });

  it("gives OWNER every permission", () => {
    for (const p of PERMISSIONS) {
      expect(can("OWNER", p), `OWNER missing ${p}`).toBe(true);
    }
  });

  it("denies ADMIN :write on company (only OWNER edits company settings)", () => {
    expect(can("ADMIN", "company:write")).toBe(false);
    expect(can("ADMIN", "company:read")).toBe(true);
  });

  it("denies ADMIN :write on team (only OWNER manages users)", () => {
    expect(can("ADMIN", "team:write")).toBe(false);
    expect(can("ADMIN", "team:read")).toBe(true);
  });

  it("denies ADMIN billing:write", () => {
    expect(can("ADMIN", "billing:write")).toBe(false);
  });

  it("lets OFFICE edit quotes, invoices and clients", () => {
    expect(can("OFFICE", "quote:write")).toBe(true);
    expect(can("OFFICE", "invoice:write")).toBe(true);
    expect(can("OFFICE", "client:write")).toBe(true);
  });

  it("denies OFFICE workorder:write (technicians are field-only)", () => {
    expect(can("OFFICE", "workorder:write:all")).toBe(false);
    expect(can("OFFICE", "workorder:write:own")).toBe(false);
    expect(can("OFFICE", "workorder:read:all")).toBe(false);
  });

  it("gives TECHNICIAN only their own work orders", () => {
    expect(can("TECHNICIAN", "workorder:read:own")).toBe(true);
    expect(can("TECHNICIAN", "workorder:write:own")).toBe(true);
    expect(can("TECHNICIAN", "workorder:read:all")).toBe(false);
    expect(can("TECHNICIAN", "workorder:write:all")).toBe(false);
  });

  it("denies TECHNICIAN quote and invoice access", () => {
    expect(can("TECHNICIAN", "quote:read")).toBe(false);
    expect(can("TECHNICIAN", "invoice:read")).toBe(false);
  });

  it("gives every role access to their own profile", () => {
    for (const role of ROLES) {
      expect(can(role, "profile:read:self"), `${role} missing profile:read:self`).toBe(true);
      expect(can(role, "profile:write:self"), `${role} missing profile:write:self`).toBe(true);
    }
  });

  it("does not give TECHNICIAN access to email/team/billing", () => {
    expect(can("TECHNICIAN", "email:read")).toBe(false);
    expect(can("TECHNICIAN", "email:write")).toBe(false);
    expect(can("TECHNICIAN", "team:read")).toBe(false);
    expect(can("TECHNICIAN", "billing:read")).toBe(false);
  });

  it("matrix has an entry for every role", () => {
    for (const role of ROLES) {
      expect(ROLE_PERMISSIONS[role], `missing ROLE_PERMISSIONS.${role}`).toBeDefined();
    }
  });

  it("does not contain unknown permissions in any role's set", () => {
    const known = new Set<string>(PERMISSIONS);
    for (const role of ROLES) {
      for (const p of ROLE_PERMISSIONS[role]) {
        expect(known.has(p), `unknown permission ${p} in role ${role}`).toBe(true);
      }
    }
  });
});

describe("canAny", () => {
  it("returns true if the role has at least one of the listed permissions", () => {
    expect(canAny("OWNER", ["company:write", "billing:write"])).toBe(true);
    expect(canAny("ADMIN", ["company:write", "billing:write"])).toBe(false);
    expect(canAny("ADMIN", ["company:write", "email:read"])).toBe(true);
  });

  it("returns false for an empty list (vacuously false, not true)", () => {
    expect(canAny("OWNER", [])).toBe(false);
    expect(canAny("TECHNICIAN", [])).toBe(false);
  });
});

describe("canAll", () => {
  it("returns true only if every permission is granted", () => {
    expect(canAll("OWNER", ["company:read", "company:write"])).toBe(true);
    expect(canAll("ADMIN", ["company:read", "company:write"])).toBe(false);
  });

  it("returns true for an empty list (vacuously true)", () => {
    expect(canAll("OWNER", [])).toBe(true);
    expect(canAll("TECHNICIAN", [])).toBe(true);
  });
});

describe("type-level sanity", () => {
  it("rejects role strings that are not in ROLES at runtime", async () => {
    const { isRole } = await import("@/lib/auth/roles");
    expect(isRole("OWNER")).toBe(true);
    expect(isRole("admin")).toBe(false); // case-sensitive
    expect(isRole("ROOT")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });
});
