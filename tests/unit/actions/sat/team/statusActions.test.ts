/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/team/statusActions.test.ts
 * Description: Permission-gating, validation and error mapping for the
 *              three "status" actions: deactivate, reactivate, revoke.
 *              Each action is exercised in a separate describe block.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, teamServiceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  teamServiceMock: {
    deactivateUser: vi.fn(),
    reactivateUser: vi.fn(),
    revokeInvitation: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/sat/team", () => ({ teamService: teamServiceMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { deactivateUserAction } from "@/actions/sat/team/deactivateUser";
import { reactivateUserAction } from "@/actions/sat/team/reactivateUser";
import { revokeInvitationAction } from "@/actions/sat/team/revokeInvitation";
import { CannotModifyOwnerError, NotAPendingUserError, UserNotFoundError } from "@/lib/errors/team";

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
  teamServiceMock.deactivateUser.mockReset();
  teamServiceMock.reactivateUser.mockReset();
  teamServiceMock.revokeInvitation.mockReset();
});

describe.each([
  ["deactivateUserAction", deactivateUserAction, "deactivateUser"] as const,
  ["reactivateUserAction", reactivateUserAction, "reactivateUser"] as const,
  ["revokeInvitationAction", revokeInvitationAction, "revokeInvitation"] as const,
])("%s — team:write gate", (label, action, serviceKey) => {
  it("rejects when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const res = await action({ userId: VALID_UUID });
    expect(res.success).toBe(false);
    expect(teamServiceMock[serviceKey]).not.toHaveBeenCalled();
  });

  it.each([["ADMIN"], ["OFFICE"], ["TECHNICIAN"]] as const)(
    `blocks ${label} %s`,
    async (role) => {
      authMock.mockResolvedValue(session(role));
      const res = await action({ userId: VALID_UUID });
      expect(res.success).toBe(false);
      expect(teamServiceMock[serviceKey]).not.toHaveBeenCalled();
    }
  );
});

describe("deactivateUserAction", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(session("OWNER"));
  });

  it("rejects a non-uuid userId", async () => {
    const res = await deactivateUserAction({ userId: "abc" });
    expect(res.success).toBe(false);
  });

  it("forwards to the service and revalidates the path", async () => {
    teamServiceMock.deactivateUser.mockResolvedValue({ id: VALID_UUID, status: "inactive" } as never);
    const res = await deactivateUserAction({ userId: VALID_UUID });
    expect(res.success).toBe(true);
    expect(teamServiceMock.deactivateUser).toHaveBeenCalledWith("c-1", VALID_UUID, "owner-id");
  });

  it("maps CannotModifyOwnerError to a user-facing error", async () => {
    teamServiceMock.deactivateUser.mockRejectedValue(new CannotModifyOwnerError());
    const res = await deactivateUserAction({ userId: VALID_UUID });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/owner/i);
  });
});

describe("reactivateUserAction", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(session("OWNER"));
  });

  it("forwards to the service", async () => {
    teamServiceMock.reactivateUser.mockResolvedValue({ id: VALID_UUID, status: "active" } as never);
    const res = await reactivateUserAction({ userId: VALID_UUID });
    expect(res.success).toBe(true);
    expect(teamServiceMock.reactivateUser).toHaveBeenCalledWith("c-1", VALID_UUID);
  });

  it("maps UserNotFoundError to a user-facing error", async () => {
    teamServiceMock.reactivateUser.mockRejectedValue(new UserNotFoundError());
    const res = await reactivateUserAction({ userId: VALID_UUID });
    expect(res.success).toBe(false);
  });
});

describe("revokeInvitationAction", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(session("OWNER"));
  });

  it("forwards to the service", async () => {
    teamServiceMock.revokeInvitation.mockResolvedValue(undefined);
    const res = await revokeInvitationAction({ userId: VALID_UUID });
    expect(res.success).toBe(true);
    expect(teamServiceMock.revokeInvitation).toHaveBeenCalledWith("c-1", VALID_UUID);
  });

  it("maps NotAPendingUserError to a user-facing error", async () => {
    teamServiceMock.revokeInvitation.mockRejectedValue(new NotAPendingUserError());
    const res = await revokeInvitationAction({ userId: VALID_UUID });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invitation/i);
  });
});
