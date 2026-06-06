/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/services/sat/team/invitations.test.ts
 * Description: Verifies the invitation token generator and the
 *              INVITATION_TTL_DAYS constant. Token generation is
 *              non-deterministic by design, so we only assert
 *              shape (length, charset) and uniqueness across calls.
 */

import { describe, it, expect } from "vitest";
import {
  generateInvitationToken,
  INVITATION_TTL_DAYS,
  invitationExpiry,
} from "@/services/sat/team/utils/invitations";

describe("generateInvitationToken", () => {
  it("returns a 43-character base64url string (32 bytes)", () => {
    const t = generateInvitationToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("returns a different token every time", () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) set.add(generateInvitationToken());
    expect(set.size).toBe(50);
  });
});

describe("INVITATION_TTL_DAYS", () => {
  it("is 7 days by default", () => {
    expect(INVITATION_TTL_DAYS).toBe(7);
  });
});

describe("invitationExpiry", () => {
  it("returns a date exactly TTL days after the input", () => {
    const start = new Date("2026-06-06T12:00:00Z");
    const exp = invitationExpiry(start);
    const diffDays = (exp.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });

  it("defaults the base date to now", () => {
    const before = Date.now();
    const exp = invitationExpiry();
    const after = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(exp.getTime()).toBeGreaterThanOrEqual(before + sevenDays);
    expect(exp.getTime()).toBeLessThanOrEqual(after + sevenDays);
  });
});
