/**
 * Creation/modification date: 01/06/2026
 * Path: tests/unit/lib/utils/encryption.test.ts
 * Description: Unit tests for AES-256-GCM symmetric encryption utility used to
 *              protect secrets at rest (e.g. SMTP passwords in smtp_configs).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { encrypt, decrypt, isEncryptedPayload } from "@/lib/utils/encryption";

const TEST_KEY = "1nxPRnrSTGRom+3VCvvuBFJZnURaWCp+5KPDq9W9DuU=";

describe("Encryption Utils (AES-256-GCM)", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  describe("encrypt / decrypt roundtrip", () => {
    it("encrypts and decrypts a string back to the original", () => {
      const plain = "my-secret-smtp-password-123!";
      const cipher = encrypt(plain);
      const back = decrypt(cipher);
      expect(back).toBe(plain);
    });

    it("produces a different ciphertext each call (random IV)", () => {
      const plain = "same-input";
      const a = encrypt(plain);
      const b = encrypt(plain);
      expect(a).not.toBe(b);
    });

    it("returns a base64 payload in the expected iv:tag:ct format", () => {
      const cipher = encrypt("hello");
      const parts = cipher.split(":");
      expect(parts).toHaveLength(3);
      parts.forEach((p) => {
        expect(p).toMatch(/^[A-Za-z0-9+/]+=*$/);
      });
    });
  });

  describe("decrypt validation", () => {
    it("throws on tampered ciphertext (auth tag mismatch)", () => {
      const cipher = encrypt("important-data");
      const [iv, tag, ct] = cipher.split(":");
      const tampered = `${iv}:${tag}:${ct.slice(0, -2)}AA`;
      expect(() => decrypt(tampered)).toThrow();
    });

    it("throws on malformed payload (wrong number of parts)", () => {
      expect(() => decrypt("only-one-part")).toThrow(/malformed/i);
      expect(() => decrypt("a:b")).toThrow(/malformed/i);
      expect(() => decrypt("a:b:c:d")).toThrow(/malformed/i);
    });

    it("throws on invalid base64 characters", () => {
      expect(() => decrypt("!!!:!!!:!!!")).toThrow();
    });
  });

  describe("isEncryptedPayload", () => {
    it("returns true for valid encrypted payloads", () => {
      expect(isEncryptedPayload(encrypt("x"))).toBe(true);
    });

    it("returns false for plain text", () => {
      expect(isEncryptedPayload("plain-password")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isEncryptedPayload("")).toBe(false);
    });

    it("returns false for partial payload", () => {
      expect(isEncryptedPayload("abc:def")).toBe(false);
    });
  });

  describe("missing key behavior", () => {
    it("throws a clear error when ENCRYPTION_KEY is missing", () => {
      const original = process.env.ENCRYPTION_KEY;
      delete process.env.ENCRYPTION_KEY;
      try {
        expect(() => encrypt("x")).toThrow(/ENCRYPTION_KEY/);
      } finally {
        process.env.ENCRYPTION_KEY = original;
      }
    });
  });
});
