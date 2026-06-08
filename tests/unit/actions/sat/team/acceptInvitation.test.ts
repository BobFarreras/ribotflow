/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/team/acceptInvitation.test.ts
 * Description: Server Action tests for the public invitation flow.
 *              Mocks the team service so the action layer is exercised
 *              without a real DB.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { teamServiceMock } = vi.hoisted(() => ({
  teamServiceMock: {
    acceptInvitation: vi.fn(),
  },
}));

vi.mock("@/services/sat/team", () => ({ teamService: teamServiceMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { acceptInvitationAction } from "@/actions/sat/team/acceptInvitation";
import {
  InvalidInvitationTokenError,
  NotAPendingUserError,
} from "@/lib/errors/team";
import { PasswordTooShortError } from "@/lib/errors/profile";

beforeEach(() => {
  teamServiceMock.acceptInvitation.mockReset();
});

describe("acceptInvitationAction", () => {
  it("rejects an empty payload", async () => {
    const r = await acceptInvitationAction({});
    expect(r.success).toBe(false);
  });

  it("rejects a too-short password", async () => {
    const r = await acceptInvitationAction({
      token: "abcdefghijk-1234567890",
      password: "short",
      confirmPassword: "short",
    });
    expect(r.success).toBe(false);
  });

  it("rejects when confirmation does not match", async () => {
    const r = await acceptInvitationAction({
      token: "abcdefghijk-1234567890",
      password: "ValidP@ss1",
      confirmPassword: "DifferentP@ss",
    });
    expect(r.success).toBe(false);
  });

  it("returns INVALID_TOKEN when the service throws InvalidInvitationToken", async () => {
    teamServiceMock.acceptInvitation.mockRejectedValueOnce(
      new InvalidInvitationTokenError()
    );
    const r = await acceptInvitationAction({
      token: "abcdefghijk-1234567890",
      password: "ValidP@ss1",
      confirmPassword: "ValidP@ss1",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBe("INVALID_TOKEN");
  });

  it("returns ALREADY_ACCEPTED when the user is no longer pending", async () => {
    teamServiceMock.acceptInvitation.mockRejectedValueOnce(
      new NotAPendingUserError()
    );
    const r = await acceptInvitationAction({
      token: "abcdefghijk-1234567890",
      password: "ValidP@ss1",
      confirmPassword: "ValidP@ss1",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBe("ALREADY_ACCEPTED");
  });

  it("returns PASSWORD_TOO_SHORT when the password is below the minimum", async () => {
    teamServiceMock.acceptInvitation.mockRejectedValueOnce(
      new PasswordTooShortError()
    );
    const r = await acceptInvitationAction({
      token: "abcdefghijk-1234567890",
      password: "ValidP@ss1",
      confirmPassword: "ValidP@ss1",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBe("PASSWORD_TOO_SHORT");
  });

  it("returns the email and name on success", async () => {
    teamServiceMock.acceptInvitation.mockResolvedValueOnce({
      member: { id: "u-1", email: "joan@acme.test", name: "Joan", role: "TECHNICIAN" },
    });
    const r = await acceptInvitationAction({
      token: "abcdefghijk-1234567890",
      password: "ValidP@ss1",
      confirmPassword: "ValidP@ss1",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("joan@acme.test");
      expect(r.data.name).toBe("Joan");
    }
  });
});
