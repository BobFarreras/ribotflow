/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/profile/sessionsActions.test.ts
 * Description: Server Action tests for the active-sessions feature.
 *              Mocks auth(), the sessions service, and
 *              getCurrentSessionFingerprint so no real DB connection is used.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, sessionsServiceMock, getCurrentSessionFingerprintMock, revalidatePathMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    sessionsServiceMock: {
      listActiveSessions: vi.fn(),
      revokeSession: vi.fn(),
      revokeAllOtherSessions: vi.fn(),
    },
    getCurrentSessionFingerprintMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  }));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/sat/sessions", () => ({
  sessionsService: sessionsServiceMock,
  CannotRevokeCurrentSessionError: class CannotRevokeCurrentSessionError extends Error {
    code = "cannot_revoke_current_session";
  },
  SessionNotFoundError: class SessionNotFoundError extends Error {
    code = "session_not_found";
  },
}));
vi.mock("@/lib/auth/currentSession", () => ({
  getCurrentSessionFingerprint: getCurrentSessionFingerprintMock,
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { listActiveSessionsAction } from "@/actions/sat/profile/listActiveSessions";
import { revokeSessionAction } from "@/actions/sat/profile/revokeSession";
import { revokeAllOtherSessionsAction } from "@/actions/sat/profile/revokeAllOtherSessions";

function session() {
  return { user: { id: "u-1", companyId: "c-1", role: "OWNER" } };
}

const FP = { userAgent: "Mozilla/5.0", ipAddress: "127.0.0.1" };

beforeEach(() => {
  authMock.mockReset();
  sessionsServiceMock.listActiveSessions.mockReset();
  sessionsServiceMock.revokeSession.mockReset();
  sessionsServiceMock.revokeAllOtherSessions.mockReset();
  getCurrentSessionFingerprintMock.mockReset();
  revalidatePathMock.mockReset();
});

/* ================================================================
   listActiveSessionsAction
   ================================================================ */

describe("listActiveSessionsAction", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await listActiveSessionsAction();
    expect(r.success).toBe(false);
  });

  it("returns the sessions and the current fingerprint", async () => {
    authMock.mockResolvedValue(session());
    sessionsServiceMock.listActiveSessions.mockResolvedValue([
      {
        id: "s-1",
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expires: new Date(),
        userAgent: "Chrome",
        ipAddress: "127.0.0.1",
      },
    ]);
    getCurrentSessionFingerprintMock.mockResolvedValue(FP);
    const r = await listActiveSessionsAction();
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.sessions).toHaveLength(1);
      expect(r.data.currentFingerprint).toEqual(FP);
    }
  });
});

/* ================================================================
   revokeSessionAction
   ================================================================ */

describe("revokeSessionAction", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await revokeSessionAction({ sessionId: "s-1" });
    expect(r.success).toBe(false);
  });

  it("rejects malformed input", async () => {
    authMock.mockResolvedValue(session());
    const r = await revokeSessionAction({ sessionId: "not-a-uuid" });
    expect(r.success).toBe(false);
  });

  it("forwards to the service and revalidates on success", async () => {
    authMock.mockResolvedValue(session());
    getCurrentSessionFingerprintMock.mockResolvedValue(FP);
    sessionsServiceMock.revokeSession.mockResolvedValue(undefined);
    const r = await revokeSessionAction({
      sessionId: "11111111-1111-1111-1111-111111111111",
    });
    expect(r.success).toBe(true);
    expect(sessionsServiceMock.revokeSession).toHaveBeenCalledWith(
      "u-1",
      "11111111-1111-1111-1111-111111111111",
      FP
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/settings/profile");
  });
});

/* ================================================================
   revokeAllOtherSessionsAction
   ================================================================ */

describe("revokeAllOtherSessionsAction", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await revokeAllOtherSessionsAction();
    expect(r.success).toBe(false);
  });

  it("returns the number of sessions revoked", async () => {
    authMock.mockResolvedValue(session());
    getCurrentSessionFingerprintMock.mockResolvedValue(FP);
    sessionsServiceMock.revokeAllOtherSessions.mockResolvedValue(3);
    const r = await revokeAllOtherSessionsAction();
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.revoked).toBe(3);
    expect(revalidatePathMock).toHaveBeenCalledWith("/settings/profile");
  });
});
