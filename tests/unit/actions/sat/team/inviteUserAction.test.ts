/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/team/inviteUserAction.test.ts
 * Description: Verifies the permission gate and the validation path of
 *              the inviteUser Server Action. We never reach the real DB
 *              because we mock the teamService entirely.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { authMock, teamServiceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  teamServiceMock: {
    inviteUser: vi.fn(),
    resendInvitation: vi.fn(),
    revokeInvitation: vi.fn(),
    changeUserRole: vi.fn(),
    deactivateUser: vi.fn(),
    reactivateUser: vi.fn(),
    acceptInvitationToken: vi.fn(),
    findTeamMember: vi.fn(),
    listTeamMembers: vi.fn(),
    findUserName: vi.fn(),
    companyHasOwner: vi.fn(),
    countActiveAdminsExcluding: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/sat/team", () => ({ teamService: teamServiceMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { inviteUserAction } from "@/actions/sat/team/inviteUser";
import { CannotInviteOwnerError, UserAlreadyExistsError } from "@/lib/errors/team";

function session(role: "OWNER" | "ADMIN" | "OFFICE" | "TECHNICIAN" | null) {
  if (role === null) return null;
  return {
    user: {
      id: "owner-id",
      companyId: "c-1",
      role,
      email: "owner@x.com",
      name: "Owner",
    },
  };
}

beforeEach(() => {
  authMock.mockReset();
  teamServiceMock.inviteUser.mockReset();
});

describe("inviteUserAction — team:write gate", () => {
  it("rejects when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const res = await inviteUserAction({ name: "X", email: "x@x.com", role: "ADMIN" });
    expect(res.success).toBe(false);
    expect(teamServiceMock.inviteUser).not.toHaveBeenCalled();
  });

  it.each([["ADMIN"], ["OFFICE"], ["TECHNICIAN"]] as const)(
    "blocks %s (no team:write)",
    async (role) => {
      authMock.mockResolvedValue(session(role));
      const res = await inviteUserAction({ name: "X", email: "x@x.com", role: "TECHNICIAN" });
      expect(res.success).toBe(false);
      expect(teamServiceMock.inviteUser).not.toHaveBeenCalled();
    }
  );
});

describe("inviteUserAction — validation", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(session("OWNER"));
  });

  it("rejects an invalid email", async () => {
    const res = await inviteUserAction({ name: "X", email: "not-an-email", role: "ADMIN" });
    expect(res.success).toBe(false);
    expect(teamServiceMock.inviteUser).not.toHaveBeenCalled();
  });

  it("rejects an OWNER role at the schema layer", async () => {
    const res = await inviteUserAction({ name: "X", email: "x@x.com", role: "OWNER" });
    expect(res.success).toBe(false);
    expect(teamServiceMock.inviteUser).not.toHaveBeenCalled();
  });

  it("rejects an empty name", async () => {
    const res = await inviteUserAction({ name: "  ", email: "x@x.com", role: "ADMIN" });
    expect(res.success).toBe(false);
  });
});

describe("inviteUserAction — happy path", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(session("OWNER"));
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "self-hosted");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the invitation URL in dev mode", async () => {
    teamServiceMock.inviteUser.mockResolvedValue({
      member: { id: "u-2" } as never,
      invitationToken: "tok-123",
    });
    const res = await inviteUserAction(
      { name: "Joan", email: "joan@x.com", role: "TECHNICIAN" },
      "http://localhost:3000"
    );
    expect(res.success).toBe(true);
    expect(res.invitationUrl).toBe("http://localhost:3000/accept-invitation?token=tok-123");
    expect(teamServiceMock.inviteUser).toHaveBeenCalledWith({
      companyId: "c-1",
      email: "joan@x.com",
      name: "Joan",
      role: "TECHNICIAN",
      invitedBy: "owner-id",
    });
  });

  it("surfaces a user-facing error when the email is already in use", async () => {
    teamServiceMock.inviteUser.mockRejectedValue(new UserAlreadyExistsError());
    const res = await inviteUserAction({ name: "Joan", email: "j@x.com", role: "ADMIN" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/already/i);
  });

  it("surfaces a user-facing error when trying to invite a second OWNER", async () => {
    teamServiceMock.inviteUser.mockRejectedValue(new CannotInviteOwnerError());
    const res = await inviteUserAction({ name: "Joan", email: "j@x.com", role: "ADMIN" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/owner/i);
  });
});
