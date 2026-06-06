/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/team/resendInvitationAction.test.ts
 * Description: Verifies the team:write gate and the URL construction of
 *              resendInvitationAction. The action returns a fresh URL in
 *              dev mode and nothing in cloud mode.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { authMock, teamServiceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  teamServiceMock: {
    resendInvitation: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/sat/team", () => ({ teamService: teamServiceMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { resendInvitationAction } from "@/actions/sat/team/resendInvitation";
import { NotAPendingUserError } from "@/lib/errors/team";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

function session(role: "OWNER" | "ADMIN" | "OFFICE" | "TECHNICIAN" | null) {
  if (role === null) return null;
  return {
    user: {
      id: "owner-id",
      companyId: "c-1",
      role,
      email: "o@x.com",
      name: "Owner",
    },
  };
}

beforeEach(() => {
  authMock.mockReset();
  teamServiceMock.resendInvitation.mockReset();
});

describe("resendInvitationAction — team:write gate", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const res = await resendInvitationAction({ userId: VALID_UUID });
    expect(res.success).toBe(false);
  });

  it.each([["ADMIN"], ["OFFICE"], ["TECHNICIAN"]] as const)(
    "blocks %s",
    async (role) => {
      authMock.mockResolvedValue(session(role));
      const res = await resendInvitationAction({ userId: VALID_UUID });
      expect(res.success).toBe(false);
      expect(teamServiceMock.resendInvitation).not.toHaveBeenCalled();
    }
  );
});

describe("resendInvitationAction — happy path", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(session("OWNER"));
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "self-hosted");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the new invitation URL in dev mode", async () => {
    teamServiceMock.resendInvitation.mockResolvedValue({
      member: { id: VALID_UUID },
      invitationToken: "new-tok",
    } as never);
    const res = await resendInvitationAction(
      { userId: VALID_UUID },
      "http://localhost:3000"
    );
    expect(res.success).toBe(true);
    expect(res.invitationUrl).toBe("http://localhost:3000/accept-invitation?token=new-tok");
    expect(teamServiceMock.resendInvitation).toHaveBeenCalledWith("c-1", VALID_UUID);
  });

  it("maps NotAPendingUserError to a user-facing error", async () => {
    teamServiceMock.resendInvitation.mockRejectedValue(new NotAPendingUserError());
    const res = await resendInvitationAction({ userId: VALID_UUID });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invitation/i);
  });
});
