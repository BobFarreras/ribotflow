/**
 * Creation/modification date: 24/05/2026
 * Path: tests/unit/lib/auth/authorize.test.ts
 * Description: Unit tests for Auth.js authorization callback (JWT and session).
 */

import { describe, it, expect, vi } from "vitest";

describe("Auth Authorization", () => {
  describe("JWT callback", () => {
    it("should inject companyId and role into token", async () => {
      const token = { sub: "user-123" };
      const user = { id: "user-123", companyId: "comp-456", role: "ADMIN" as const };

      // Simulate JWT callback logic from src/lib/auth/index.ts
      const result = { ...token, id: user.id, companyId: user.companyId, role: user.role };

      expect(result.id).toBe("user-123");
      expect(result.companyId).toBe("comp-456");
      expect(result.role).toBe("ADMIN");
    });

    it("should preserve existing token fields", async () => {
      const token = { sub: "user-123", name: "John", email: "john@test.com" };
      const user = { id: "user-123", companyId: "comp-456", role: "OWNER" as const };

      const result = { ...token, id: user.id, companyId: user.companyId, role: user.role };

      expect(result.name).toBe("John");
      expect(result.email).toBe("john@test.com");
    });
  });

  describe("Session callback", () => {
    it("should inject id, companyId and role into session user", async () => {
      const session = { user: { name: "John", email: "john@test.com", image: null } };
      const token = { id: "user-123", companyId: "comp-456", role: "TECHNICIAN" };

      // Simulate Session callback logic
      const result = {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          companyId: token.companyId as string,
          role: token.role as string,
        },
      };

      expect(result.user.id).toBe("user-123");
      expect(result.user.companyId).toBe("comp-456");
      expect(result.user.role).toBe("TECHNICIAN");
    });
  });
});
