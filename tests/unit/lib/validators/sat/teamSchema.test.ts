/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/lib/validators/sat/teamSchema.test.ts
 * Description: Zod schema tests for the team management actions.
 */

import { describe, it, expect } from "vitest";
import {
  inviteUserSchema,
  changeUserRoleSchema,
  userIdSchema,
} from "@/lib/validators/sat/teamSchema";

describe("inviteUserSchema", () => {
  it("accepts a valid ADMIN invitation", () => {
    const r = inviteUserSchema.safeParse({
      name: "Joan Garcia",
      email: "joan@example.com",
      role: "ADMIN",
    });
    expect(r.success).toBe(true);
  });

  it("accepts TECHNICIAN and OFFICE", () => {
    expect(
      inviteUserSchema.safeParse({ name: "Tècnic", email: "t@x.com", role: "TECHNICIAN" }).success
    ).toBe(true);
    expect(
      inviteUserSchema.safeParse({ name: "Oficina", email: "o@x.com", role: "OFFICE" }).success
    ).toBe(true);
  });

  it("rejects OWNER (only one owner per company)", () => {
    const r = inviteUserSchema.safeParse({
      name: "X",
      email: "x@x.com",
      role: "OWNER",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const r = inviteUserSchema.safeParse({
      name: "X",
      email: "not-an-email",
      role: "ADMIN",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const r = inviteUserSchema.safeParse({
      name: "  ",
      email: "x@x.com",
      role: "ADMIN",
    });
    expect(r.success).toBe(false);
  });

  it("trims surrounding whitespace from the name", () => {
    const r = inviteUserSchema.safeParse({
      name: "  Joan  ",
      email: "j@x.com",
      role: "ADMIN",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Joan");
  });

  it("rejects an unknown role", () => {
    const r = inviteUserSchema.safeParse({
      name: "X",
      email: "x@x.com",
      role: "GOD",
    });
    expect(r.success).toBe(false);
  });
});

describe("changeUserRoleSchema", () => {
  it("accepts a valid role change", () => {
    const r = changeUserRoleSchema.safeParse({
      userId: "11111111-1111-4111-8111-111111111111",
      role: "ADMIN",
    });
    expect(r.success).toBe(true);
  });

  it("accepts a promotion to OWNER (caller is responsible for the limit)", () => {
    const r = changeUserRoleSchema.safeParse({
      userId: "11111111-1111-4111-8111-111111111111",
      role: "OWNER",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a non-uuid userId", () => {
    const r = changeUserRoleSchema.safeParse({ userId: "abc", role: "ADMIN" });
    expect(r.success).toBe(false);
  });
});

describe("userIdSchema", () => {
  it("accepts a valid uuid", () => {
    const r = userIdSchema.safeParse({ userId: "11111111-1111-4111-8111-111111111111" });
    expect(r.success).toBe(true);
  });

  it("rejects a non-uuid", () => {
    const r = userIdSchema.safeParse({ userId: "not-a-uuid" });
    expect(r.success).toBe(false);
  });
});
