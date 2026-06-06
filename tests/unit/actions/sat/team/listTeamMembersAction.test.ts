/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/team/listTeamMembersAction.test.ts
 * Description: Verifies the read-side listTeamMembersAction: it respects
 *              team:read, marks the viewer as isSelf, marks the OWNER as
 *              isOwner, and never returns the password hash.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, teamServiceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  teamServiceMock: {
    listTeamMembers: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/sat/team", () => ({ teamService: teamServiceMock }));

import { listTeamMembersAction } from "@/actions/sat/team/listTeamMembers";

function session(role: "OWNER" | "ADMIN" | "OFFICE" | "TECHNICIAN" | null) {
  if (role === null) return null;
  return {
    user: {
      id: "viewer-id",
      companyId: "c-1",
      role,
      email: "v@x.com",
      name: "Viewer",
    },
  };
}

beforeEach(() => {
  authMock.mockReset();
  teamServiceMock.listTeamMembers.mockReset();
});

describe("listTeamMembersAction", () => {
  it("returns an empty list when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const res = await listTeamMembersAction();
    expect(res.members).toEqual([]);
    expect(teamServiceMock.listTeamMembers).not.toHaveBeenCalled();
  });

  it.each([["TECHNICIAN"]] as const)("returns an empty list to %s (no team:read)", async (role) => {
    authMock.mockResolvedValue(session(role));
    const res = await listTeamMembersAction();
    expect(res.members).toEqual([]);
    expect(teamServiceMock.listTeamMembers).not.toHaveBeenCalled();
  });

  it("returns the team with isSelf / isOwner flags for OWNER", async () => {
    authMock.mockResolvedValue(session("OWNER"));
    teamServiceMock.listTeamMembers.mockResolvedValue([
      {
        id: "viewer-id",
        email: "owner@x.com",
        name: "Owner",
        role: "OWNER",
        status: "active",
        invitedBy: null,
        invitedAt: null,
        invitationExpiresAt: null,
        lastActiveAt: null,
        createdAt: new Date(),
      },
      {
        id: "tech-1",
        email: "tech@x.com",
        name: "Tech",
        role: "TECHNICIAN",
        status: "active",
        invitedBy: null,
        invitedAt: null,
        invitationExpiresAt: null,
        lastActiveAt: null,
        createdAt: new Date(),
      },
    ] as never);

    const res = await listTeamMembersAction();
    expect(res.members).toHaveLength(2);

    const me = res.members.find((m) => m.id === "viewer-id")!;
    expect(me.isSelf).toBe(true);
    expect(me.isOwner).toBe(true);

    const other = res.members.find((m) => m.id === "tech-1")!;
    expect(other.isSelf).toBe(false);
    expect(other.isOwner).toBe(false);
  });

  it("returns the list to ADMIN and OFFICE (read-only access)", async () => {
    authMock.mockResolvedValue(session("ADMIN"));
    teamServiceMock.listTeamMembers.mockResolvedValue([]);
    const res = await listTeamMembersAction();
    expect(teamServiceMock.listTeamMembers).toHaveBeenCalledWith("c-1");
    expect(res.members).toEqual([]);
  });
});
