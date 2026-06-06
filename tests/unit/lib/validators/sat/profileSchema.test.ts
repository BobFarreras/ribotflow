/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/lib/validators/sat/profileSchema.test.ts
 * Description: Zod schema tests for the profile actions.
 */

import { describe, it, expect } from "vitest";
import {
  updateNameSchema,
  changePasswordSchema,
  avatarUploadMetaSchema,
} from "@/lib/validators/sat/profileSchema";

describe("updateNameSchema", () => {
  it("accepts a valid name", () => {
    const r = updateNameSchema.safeParse({ name: "Joan Garcia" });
    expect(r.success).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    const r = updateNameSchema.safeParse({ name: "  Joan  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Joan");
  });

  it("rejects an empty name", () => {
    expect(updateNameSchema.safeParse({ name: "" }).success).toBe(false);
    expect(updateNameSchema.safeParse({ name: "  " }).success).toBe(false);
  });

  it("rejects a name longer than 100 chars", () => {
    const r = updateNameSchema.safeParse({ name: "x".repeat(101) });
    expect(r.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a valid password change", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "oldP@ss123",
      newPassword: "newP@ss123",
      confirmPassword: "newP@ss123",
    });
    expect(r.success).toBe(true);
  });

  it("rejects when confirmation does not match", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "newP@ss123",
      confirmPassword: "different",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a new password shorter than 8 chars", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty current password", () => {
    const r = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "newP@ss123",
      confirmPassword: "newP@ss123",
    });
    expect(r.success).toBe(false);
  });
});

describe("avatarUploadMetaSchema", () => {
  it("accepts PNG / JPEG / WebP / SVG", () => {
    for (const mime of ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]) {
      const r = avatarUploadMetaSchema.safeParse({
        fileName: "avatar.png",
        mimeType: mime,
        sizeBytes: 1024,
      });
      expect(r.success, mime).toBe(true);
    }
  });

  it("rejects an unsupported mime type", () => {
    const r = avatarUploadMetaSchema.safeParse({
      fileName: "avatar.gif",
      mimeType: "image/gif",
      sizeBytes: 1024,
    });
    expect(r.success).toBe(false);
  });

  it("rejects files larger than 2 MB", () => {
    const r = avatarUploadMetaSchema.safeParse({
      fileName: "big.png",
      mimeType: "image/png",
      sizeBytes: 3 * 1024 * 1024,
    });
    expect(r.success).toBe(false);
  });
});
