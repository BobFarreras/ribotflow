/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/team/changeUserRoleAction.test.ts
 * Description: Verifies the team:write gate, the input validation and
 *              the error mapping of changeUserRoleAction.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, teamServiceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  teamServiceMock: {
    changeUserRole: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/sat/team", () => ({ teamService: teamServiceMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { changeUserRoleAction } from "@/actions/sat/team/changeUserRole";
import { CannotModifyOwnerError, CannotModifySelfError } from "@/lib/errors/team";

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
  teamServiceMock.changeUserRole.mockReset();
});

describe("changeUserRoleAction — team:write gate", () => {
  it("rejects when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const res = await changeUserRoleAction({ userId: VALID_UUID, role: "ADMIN" });
    expect(res.success).toBe(false);
    expect(teamServiceMock.changeUserRole).not.toHaveBeenCalled();
  });

  it.each([["ADMIN"], ["OFFICE"], ["TECHNICIAN"]] as const)(
    "blocks %s",
    async (role) => {
      authMock.mockResolvedValue(session(role));
      const res = await changeUserRoleAction({ userId: VALID_UUID, role: "ADMIN" });
      expect(res.success).toBe(false);
      expect(teamServiceMock.changeUserRole).not.toHaveBeenCalled();
    }
  );
});

describe("changeUserRoleAction — validation", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(session("OWNER"));
  });

  it("rejects a non-uuid userId", async () => {
    const res = await changeUserRoleAction({ userId: "not-a-uuid", role: "ADMIN" });
    expect(res.success).toBe(false);
  });

  it("rejects an unknown role", async () => {
    const res = await changeUserRoleAction({ userId: VALID_UUID, role: "GOD" });
    expect(res.success).toBe(false);
  });
});

describe("changeUserRoleAction — happy path", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(session("OWNER"));
  });

  it("forwards the call to the service with the actor's id", async () => {
    teamServiceMock.changeUserRole.mockResolvedValue({ id: VALID_UUID, role: "TECHNICIAN" } as never);
    const res = await changeUserRoleAction({ userId: VALID_UUID, role: "TECHNICIAN" });
    expect(res.success).toBe(true);
    expect(teamServiceMock.changeUserRole).toHaveBeenCalledWith(
      "c-1",
      VALID_UUID,
      "TECHNICIAN",
      "owner-id"
    );
  });

  it("maps CannotModifyOwnerError to a user-facing error", async () => {
    teamServiceMock.changeUserRole.mockRejectedValue(new CannotModifyOwnerError());
    const res = await changeUserRoleAction({ userId: VALID_UUID, role: "ADMIN" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/owner/i);
  });

  it("maps CannotModifySelfError to a user-facing error", async () => {
    teamServiceMock.changeUserRole.mockRejectedValue(new CannotModifySelfError());
    const res = await changeUserRoleAction({ userId: VALID_UUID, role: "ADMIN" });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/your own/i);
  });
});
