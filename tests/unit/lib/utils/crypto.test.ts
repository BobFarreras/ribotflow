/**
 * Creation/modification date: 24/05/2026
 * Path: tests/unit/lib/utils/crypto.test.ts
 * Description: Unit tests for crypto utilities (hashPassword, verifyPassword).
 */

import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/utils/crypto";

describe("Crypto Utils", () => {
  describe("hashPassword", () => {
    it("should hash a plain text password", async () => {
      const password = "SecureP@ss123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith("$2")).toBe(true); // bcrypt prefix
    });

    it("should generate different hashes for the same password", async () => {
      const password = "SecureP@ss123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for correct password", async () => {
      const password = "SecureP@ss123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const password = "SecureP@ss123";
      const wrongPassword = "WrongP@ss123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should return false for empty password against hash", async () => {
      const password = "SecureP@ss123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword("", hash);

      expect(isValid).toBe(false);
    });
  });
});
