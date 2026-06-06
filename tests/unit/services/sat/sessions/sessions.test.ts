/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/services/sat/sessions/sessions.test.ts
 * Description: Unit tests for the sessions service. Mocks the Drizzle
 *              `db` so we can assert list/revoke/revokeAllOthers logic
 *              without a real connection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    delete: vi.fn(),
    returning: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  return chain;
});

vi.mock("@/db", () => ({ db: dbMock }));

import { sessionsService } from "@/services/sat/sessions";
import {
  CannotRevokeCurrentSessionError,
  SessionNotFoundError,
} from "@/services/sat/sessions";

const { listActiveSessions, revokeSession, revokeAllOtherSessions } = sessionsService;

const USER = "u-1";
const CURRENT = "s-current";
const OTHER = "s-other";

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.select.mockReturnValue(dbMock);
  dbMock.from.mockReturnValue(dbMock);
  dbMock.where.mockReturnValue(dbMock);
  dbMock.orderBy.mockReturnValue(dbMock);
  dbMock.delete.mockReturnValue(dbMock);
});

/* ================================================================
   listActiveSessions
   ================================================================ */

describe("listActiveSessions", () => {
  it("returns the rows from the DB", async () => {
    dbMock.orderBy.mockResolvedValueOnce([
      {
        id: CURRENT,
        createdAt: new Date("2026-01-01"),
        lastUsedAt: new Date("2026-01-02"),
        expires: new Date("2026-12-31"),
        userAgent: "Chrome",
        ipAddress: "127.0.0.1",
      },
    ]);
    const r = await listActiveSessions(USER);
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe(CURRENT);
    expect(r[0].userAgent).toBe("Chrome");
  });

  it("returns an empty array when no rows match", async () => {
    dbMock.orderBy.mockResolvedValueOnce([]);
    const r = await listActiveSessions(USER);
    expect(r).toEqual([]);
  });
});

/* ================================================================
   revokeSession
   ================================================================ */

describe("revokeSession", () => {
  it("deletes the matching row", async () => {
    dbMock.returning.mockResolvedValueOnce([{ id: OTHER }]);
    await expect(revokeSession(USER, OTHER, CURRENT)).resolves.toBeUndefined();
    expect(dbMock.delete).toHaveBeenCalled();
  });

  it("refuses to revoke the current session", async () => {
    await expect(revokeSession(USER, CURRENT, CURRENT)).rejects.toBeInstanceOf(
      CannotRevokeCurrentSessionError
    );
    expect(dbMock.delete).not.toHaveBeenCalled();
  });

  it("raises SessionNotFoundError when the row does not exist", async () => {
    dbMock.returning.mockResolvedValueOnce([]);
    await expect(revokeSession(USER, OTHER, CURRENT)).rejects.toBeInstanceOf(
      SessionNotFoundError
    );
  });
});

/* ================================================================
   revokeAllOtherSessions
   ================================================================ */

describe("revokeAllOtherSessions", () => {
  it("returns the number of sessions deleted", async () => {
    dbMock.returning.mockResolvedValueOnce([{ id: "a" }, { id: "b" }, { id: "c" }]);
    const n = await revokeAllOtherSessions(USER, CURRENT);
    expect(n).toBe(3);
    expect(dbMock.delete).toHaveBeenCalled();
  });

  it("returns 0 when there are no other sessions", async () => {
    dbMock.returning.mockResolvedValueOnce([]);
    const n = await revokeAllOtherSessions(USER, CURRENT);
    expect(n).toBe(0);
  });
});
