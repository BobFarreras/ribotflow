/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/lib/validators/sat/invitationSchema.test.ts
 * Description: Zod schema tests for the public invitation form.
 */

import { describe, it, expect } from "vitest";
import { acceptInvitationSchema } from "@/lib/validators/sat/invitationSchema";

describe("acceptInvitationSchema", () => {
  const valid = {
    token: "abcdefghijk-1234567890",
    password: "ValidP@ss1",
    confirmPassword: "ValidP@ss1",
  };

  it("accepts a valid payload", () => {
    const r = acceptInvitationSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("rejects a too-short token", () => {
    const r = acceptInvitationSchema.safeParse({ ...valid, token: "abc" });
    expect(r.success).toBe(false);
  });

  it("rejects a too-short password", () => {
    const r = acceptInvitationSchema.safeParse({
      ...valid,
      password: "short",
      confirmPassword: "short",
    });
    expect(r.success).toBe(false);
  });

  it("rejects when the confirmation does not match", () => {
    const r = acceptInvitationSchema.safeParse({
      ...valid,
      confirmPassword: "DifferentP@ss",
    });
    expect(r.success).toBe(false);
  });
});
