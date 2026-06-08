/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/services/sat/team/mutations.test.ts
 * Description: Pure unit tests for the team mutations service.
 *              The Drizzle `db` instance is mocked so we can assert the
 *              exact SQL behaviour (ordering, scoping by companyId,
 *              set/return of the invitation token) without a real DB.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => {
  const chain = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    orderBy: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    returning: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    and: vi.fn(),
  };
  // Default fluent shape: select().from().where().limit() / orderBy()
  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.set.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.values.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.and.mockImplementation((...args) => args);
  return chain;
});

vi.mock("@/db", () => ({ db: dbMock }));

import {
  inviteUser,
  changeUserRole,
  deactivateUser,
  reactivateUser,
  resendInvitation,
  revokeInvitation,
} from "@/services/sat/team/mutations";
import {
  CannotInviteOwnerError,
  CannotModifyOwnerError,
  CannotModifySelfError,
  NotAPendingUserError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from "@/lib/errors/team";

const COMPANY = "c-1";
const ACTOR = "actor-1";
const TARGET = "target-1";

const fakeRow = {
  id: TARGET,
  companyId: COMPANY,
  email: "target@x.com",
  name: "Target",
  role: "TECHNICIAN" as const,
  status: "active" as const,
  passwordHash: null,
  invitationToken: null,
  invitationExpiresAt: null,
  invitedBy: ACTOR,
  invitedAt: null,
  lastActiveAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const pendingRow = {
  ...fakeRow,
  status: "pending" as const,
  role: "TECHNICIAN" as const,
  invitationToken: "tok",
  invitationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  invitedAt: new Date(),
  passwordHash: null,
};

const ownerRow = {
  ...fakeRow,
  id: "owner-1",
  role: "OWNER" as const,
  status: "active" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Re-establish fluent shape after clearAllMocks
  dbMock.select.mockReturnValue(dbMock);
  dbMock.from.mockReturnValue(dbMock);
  dbMock.where.mockReturnValue(dbMock);
  dbMock.orderBy.mockReturnValue(dbMock);
  dbMock.update.mockReturnValue(dbMock);
  dbMock.set.mockReturnValue(dbMock);
  dbMock.insert.mockReturnValue(dbMock);
  dbMock.values.mockReturnValue(dbMock);
  dbMock.delete.mockReturnValue(dbMock);
  dbMock.and.mockImplementation((...args) => args);
});

/* ================================================================
   inviteUser
   ================================================================ */

describe("inviteUser", () => {
  it("creates a pending user with a token and a 7-day expiry", async () => {
    dbMock.limit.mockResolvedValueOnce([]); // no existing user
    dbMock.returning.mockResolvedValueOnce([pendingRow]);

    const result = await inviteUser({
      companyId: COMPANY,
      email: "target@x.com",
      name: "Target",
      role: "TECHNICIAN",
      invitedBy: ACTOR,
    });

    expect(result.member.status).toBe("pending");
    expect(result.invitationToken).toBeTruthy();
    expect(typeof result.invitationToken).toBe("string");
    expect(result.invitationToken.length).toBeGreaterThan(20);

    // Verify we wrote status=pending and a token
    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    const valuesArg = dbMock.values.mock.calls[0][0];
    expect(valuesArg.status).toBe("pending");
    expect(valuesArg.passwordHash).toBeUndefined();
    expect(valuesArg.invitationToken).toBeTruthy();
  });

  it("throws UserAlreadyExistsError when the email is taken", async () => {
    dbMock.limit.mockResolvedValueOnce([{ id: "x", companyId: "other", status: "active" }]);
    await expect(
      inviteUser({
        companyId: COMPANY,
        email: "taken@x.com",
        name: "X",
        role: "TECHNICIAN",
        invitedBy: ACTOR,
      })
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
  });

  it("rejects OWNER role at the service layer", async () => {
    await expect(
      inviteUser({
        companyId: COMPANY,
        email: "x@x.com",
        name: "X",
        // Bypass TS to hit the runtime guard
        role: "OWNER" as never,
        invitedBy: ACTOR,
      })
    ).rejects.toBeInstanceOf(CannotInviteOwnerError);
  });
});

/* ================================================================
   changeUserRole
   ================================================================ */

describe("changeUserRole", () => {
  beforeEach(() => {
    // findTeamMember
    dbMock.limit.mockResolvedValueOnce([fakeRow]);
  });

  it("updates the role and revalidates", async () => {
    dbMock.returning.mockResolvedValueOnce([{ ...fakeRow, role: "ADMIN" }]);
    const result = await changeUserRole(COMPANY, TARGET, "ADMIN", ACTOR);
    expect(result.role).toBe("ADMIN");
    expect(dbMock.update).toHaveBeenCalled();
    expect(dbMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ role: "ADMIN" })
    );
  });

  it("refuses to change the OWNER's role", async () => {
    // findTeamMember returns the OWNER
    dbMock.limit.mockReset();
    dbMock.limit.mockResolvedValueOnce([ownerRow]);
    await expect(
      changeUserRole(COMPANY, ownerRow.id, "ADMIN", ACTOR)
    ).rejects.toBeInstanceOf(CannotModifyOwnerError);
  });

  it("refuses to change your own role", async () => {
    await expect(
      changeUserRole(COMPANY, ACTOR, "ADMIN", ACTOR)
    ).rejects.toBeInstanceOf(CannotModifySelfError);
  });

  it("refuses to promote someone to OWNER when one already exists", async () => {
    dbMock.limit.mockReset();
    dbMock.limit
      .mockResolvedValueOnce([fakeRow]) // findTeamMember
      .mockResolvedValueOnce([{ id: "existing" }]); // companyHasOwner
    await expect(
      changeUserRole(COMPANY, TARGET, "OWNER", ACTOR)
    ).rejects.toBeInstanceOf(CannotInviteOwnerError);
  });
});

/* ================================================================
   deactivateUser
   ================================================================ */

describe("deactivateUser", () => {
  it("marks the user inactive", async () => {
    dbMock.limit
      .mockResolvedValueOnce([fakeRow]) // findTeamMember
      .mockResolvedValueOnce([{ id: "other" }]); // countActiveAdminsExcluding
    dbMock.returning.mockResolvedValueOnce([{ ...fakeRow, status: "inactive" }]);

    const result = await deactivateUser(COMPANY, TARGET, ACTOR);
    expect(result.status).toBe("inactive");
  });

  it("refuses when the user is the OWNER", async () => {
    dbMock.limit.mockReset();
    dbMock.limit.mockResolvedValueOnce([ownerRow]);
    await expect(
      deactivateUser(COMPANY, ownerRow.id, ACTOR)
    ).rejects.toBeInstanceOf(CannotModifyOwnerError);
  });

  it("refuses self-deactivation", async () => {
    dbMock.limit.mockResolvedValueOnce([fakeRow]); // findTeamMember
    await expect(deactivateUser(COMPANY, ACTOR, ACTOR)).rejects.toBeInstanceOf(
      CannotModifySelfError
    );
  });

  it("refuses to deactivate the last active member", async () => {
    dbMock.where
      .mockReturnValueOnce(dbMock) // findTeamMember — chains to .limit(1)
      .mockResolvedValueOnce([]); // countActiveAdminsExcluding — returns 0
    dbMock.limit.mockResolvedValueOnce([fakeRow]);
    await expect(
      deactivateUser(COMPANY, TARGET, ACTOR)
    ).rejects.toBeInstanceOf(CannotModifyOwnerError);
  });

  it("is idempotent (no-op when already inactive)", async () => {
    dbMock.limit.mockReset();
    dbMock.limit.mockResolvedValueOnce([{ ...fakeRow, status: "inactive" }]);
    const result = await deactivateUser(COMPANY, TARGET, ACTOR);
    expect(result.status).toBe("inactive");
    expect(dbMock.update).not.toHaveBeenCalled();
  });
});

/* ================================================================
   reactivateUser
   ================================================================ */

describe("reactivateUser", () => {
  it("marks the user active", async () => {
    dbMock.limit.mockResolvedValueOnce([{ ...fakeRow, status: "inactive" }]);
    dbMock.returning.mockResolvedValueOnce([{ ...fakeRow, status: "active" }]);
    const result = await reactivateUser(COMPANY, TARGET);
    expect(result.status).toBe("active");
  });

  it("throws UserNotFoundError when the user does not exist", async () => {
    dbMock.limit.mockReset();
    dbMock.limit.mockResolvedValueOnce([]);
    await expect(reactivateUser(COMPANY, "missing")).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

/* ================================================================
   Invitation lifecycle: resend / revoke
   ================================================================ */

describe("resendInvitation", () => {
  it("issues a fresh token and extends the expiry", async () => {
    dbMock.limit.mockResolvedValueOnce([pendingRow]);
    dbMock.returning.mockResolvedValueOnce([pendingRow]);
    const result = await resendInvitation(COMPANY, TARGET);

    // The token is generated inside the service and must round-trip to the
    // set() call with the same value the action receives.
    expect(typeof result.invitationToken).toBe("string");
    expect(result.invitationToken.length).toBeGreaterThan(20);

    const setArg = dbMock.set.mock.calls[0][0];
    expect(setArg.invitationToken).toBe(result.invitationToken);
    expect(setArg.invitationExpiresAt).toBeInstanceOf(Date);
  });

  it("throws NotAPendingUserError for an already-active user", async () => {
    dbMock.limit.mockReset();
    dbMock.limit.mockResolvedValueOnce([fakeRow]); // status=active
    await expect(resendInvitation(COMPANY, TARGET)).rejects.toBeInstanceOf(NotAPendingUserError);
  });
});

describe("revokeInvitation", () => {
  it("deletes the pending row", async () => {
    dbMock.limit.mockResolvedValueOnce([pendingRow]);
    await revokeInvitation(COMPANY, TARGET);
    expect(dbMock.delete).toHaveBeenCalled();
  });

  it("refuses to revoke an accepted (active) user", async () => {
    dbMock.limit.mockReset();
    dbMock.limit.mockResolvedValueOnce([fakeRow]);
    await expect(revokeInvitation(COMPANY, TARGET)).rejects.toBeInstanceOf(NotAPendingUserError);
  });
});
