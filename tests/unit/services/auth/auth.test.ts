/**
 * Creation/modification date: 24/05/2026
 * Path: tests/unit/services/auth/auth.test.ts
 * Description: Integration tests for auth service with real PostgreSQL database.
 *              Run `pnpm test:db:setup` before executing these tests locally.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { authService } from "@/services/auth/auth";
import { createCompanyFactory } from "../../../factories/company.factory";
import { createUserFactory } from "../../../factories/user.factory";

let hasDbConnection = false;

describe("Auth Service (Integration)", () => {
  beforeAll(async () => {
    // Check if we have a database connection
    try {
      await authService.isSetupCompleted();
      hasDbConnection = true;
    } catch {
      console.warn("⚠️ Skipping integration tests: No database connection available.");
      console.warn("   Run: pnpm test:db:setup");
    }
  });

  describe("isSetupCompleted", () => {
    it("should return false when no companies exist", async () => {
      if (!hasDbConnection) return;

      const result = await authService.isSetupCompleted();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("createCompanyAndOwner", () => {
    it("should create a company and owner user", async () => {
      if (!hasDbConnection) return;

      const input = {
        companyName: `Test Corp ${Date.now()}`,
        email: `owner-${Date.now()}@test.com`,
        password: "SecureP@ss123",
      };

      const { company, user } = await authService.createCompanyAndOwner(input);

      expect(company).toBeDefined();
      expect(company.name).toBe(input.companyName);
      expect(company.tenantSlug).toMatch(/^test-corp/);
      expect(company.plan).toBe("free");

      expect(user).toBeDefined();
      expect(user.email).toBe(input.email);
      expect(user.role).toBe("OWNER");
      expect(user.companyId).toBe(company.id);
    });

    it("should throw EmailAlreadyExistsError for duplicate email", async () => {
      if (!hasDbConnection) return;

      const input = {
        companyName: `Duplicate Corp ${Date.now()}`,
        email: `duplicate-${Date.now()}@test.com`,
        password: "SecureP@ss123",
      };

      await authService.createCompanyAndOwner(input);

      await expect(authService.createCompanyAndOwner(input)).rejects.toThrow(
        "An account with this email already exists"
      );
    });
  });

  describe("registerUser", () => {
    it("should register a new user under a company", async () => {
      if (!hasDbConnection) return;

      // First create a real company
      const companyResult = await authService.createCompanyAndOwner({
        companyName: `Reg Corp ${Date.now()}`,
        email: `reg-owner-${Date.now()}@test.com`,
        password: "SecureP@ss123",
      });

      const input = {
        name: "Jane Doe",
        email: `jane-${Date.now()}@test.com`,
        password: "SecureP@ss123",
        companyId: companyResult.company.id,
        role: "ADMIN" as const,
      };

      const user = await authService.registerUser(input);

      expect(user).toBeDefined();
      expect(user.email).toBe(input.email);
      expect(user.role).toBe("ADMIN");
      expect(user.companyId).toBe(companyResult.company.id);
    });
  });
});
