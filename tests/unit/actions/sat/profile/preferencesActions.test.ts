/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/profile/preferencesActions.test.ts
 * Description: Permission and validation checks for the preferences
 *              Server Actions. Mocks auth() and the preferences service
 *              so no real DB call happens.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, preferencesServiceMock, writeThemeCookieMock, writeLocaleCookieMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  preferencesServiceMock: {
    getUserPreferences: vi.fn(),
    upsertUserPreferences: vi.fn(),
  },
  writeThemeCookieMock: vi.fn(),
  writeLocaleCookieMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/sat/preferences", () => ({
  preferencesService: preferencesServiceMock,
}));
vi.mock("@/lib/cookies/preferencesCookies", () => ({
  writeThemeCookie: writeThemeCookieMock,
  writeLocaleCookie: writeLocaleCookieMock,
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { getPreferencesAction } from "@/actions/sat/profile/getPreferences";
import { updatePreferencesAction } from "@/actions/sat/profile/updatePreferences";

function session() {
  return {
    user: {
      id: "u-1",
      companyId: "c-1",
      role: "OWNER",
      email: "u@x.com",
      name: "User",
    },
  };
}

beforeEach(() => {
  authMock.mockReset();
  preferencesServiceMock.getUserPreferences.mockReset();
  preferencesServiceMock.upsertUserPreferences.mockReset();
  writeThemeCookieMock.mockReset();
  writeLocaleCookieMock.mockReset();
  revalidatePathMock.mockReset();
});

/* ================================================================
   getPreferencesAction
   ================================================================ */

describe("getPreferencesAction", () => {
  it("returns preferences when authenticated", async () => {
    authMock.mockResolvedValue(session());
    preferencesServiceMock.getUserPreferences.mockResolvedValue({
      userId: "u-1",
      theme: "dark",
      locale: "es",
    });
    const r = await getPreferencesAction();
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.theme).toBe("dark");
  });

  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await getPreferencesAction();
    expect(r.success).toBe(false);
  });
});

/* ================================================================
   updatePreferencesAction
   ================================================================ */

describe("updatePreferencesAction", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await updatePreferencesAction({ theme: "dark" });
    expect(r.success).toBe(false);
  });

  it("rejects an empty object", async () => {
    authMock.mockResolvedValue(session());
    const r = await updatePreferencesAction({});
    expect(r.success).toBe(false);
  });

  it("rejects an unknown theme", async () => {
    authMock.mockResolvedValue(session());
    const r = await updatePreferencesAction({ theme: "blue" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown locale", async () => {
    authMock.mockResolvedValue(session());
    const r = await updatePreferencesAction({ locale: "fr" });
    expect(r.success).toBe(false);
  });

  it("writes the theme cookie and revalidates the layout on a theme change", async () => {
    authMock.mockResolvedValue(session());
    preferencesServiceMock.upsertUserPreferences.mockResolvedValue({
      userId: "u-1",
      theme: "dark",
      locale: "ca",
    });
    const r = await updatePreferencesAction({ theme: "dark" });
    expect(r.success).toBe(true);
    expect(writeThemeCookieMock).toHaveBeenCalledWith("dark");
    expect(writeLocaleCookieMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });

  it("writes the locale cookie on a locale change", async () => {
    authMock.mockResolvedValue(session());
    preferencesServiceMock.upsertUserPreferences.mockResolvedValue({
      userId: "u-1",
      theme: "light",
      locale: "es",
    });
    const r = await updatePreferencesAction({ locale: "es" });
    expect(r.success).toBe(true);
    expect(writeLocaleCookieMock).toHaveBeenCalledWith("es");
    expect(writeThemeCookieMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });

  it("writes both cookies when both fields change at once", async () => {
    authMock.mockResolvedValue(session());
    preferencesServiceMock.upsertUserPreferences.mockResolvedValue({
      userId: "u-1",
      theme: "dark",
      locale: "es",
    });
    const r = await updatePreferencesAction({ theme: "dark", locale: "es" });
    expect(r.success).toBe(true);
    expect(writeThemeCookieMock).toHaveBeenCalledWith("dark");
    expect(writeLocaleCookieMock).toHaveBeenCalledWith("es");
  });
});
