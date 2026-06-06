/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/profile/profileActions.test.ts
 * Description: Permission/auth checks and validation for the profile
 *              Server Actions. We mock auth() and profileService so the
 *              tests never reach the DB.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, profileServiceMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  profileServiceMock: {
    getProfile: vi.fn(),
    updateName: vi.fn(),
    changePassword: vi.fn(),
    uploadAvatar: vi.fn(),
    removeAvatar: vi.fn(),
    getCompanySlug: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/sat/profile", () => ({ profileService: profileServiceMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  updateProfileNameAction,
} from "@/actions/sat/profile/updateProfile";
import { changePasswordAction } from "@/actions/sat/profile/changePassword";
import {
  uploadAvatarAction,
  removeAvatarAction,
} from "@/actions/sat/profile/uploadAvatar";
import { getProfileAction } from "@/actions/sat/profile/getProfile";
import { IncorrectPasswordError, UserNotFoundError } from "@/lib/errors/profile";

function session(role: "OWNER" | "ADMIN" | "OFFICE" | "TECHNICIAN" | null) {
  if (role === null) return null;
  return {
    user: {
      id: "u-1",
      companyId: "c-1",
      role,
      email: "u@x.com",
      name: "User",
    },
  };
}

beforeEach(() => {
  authMock.mockReset();
  profileServiceMock.getProfile.mockReset();
  profileServiceMock.updateName.mockReset();
  profileServiceMock.changePassword.mockReset();
  profileServiceMock.uploadAvatar.mockReset();
  profileServiceMock.removeAvatar.mockReset();
  profileServiceMock.getCompanySlug.mockReset();
});

/* ================================================================
   getProfileAction
   ================================================================ */

describe("getProfileAction", () => {
  it("returns the profile when authenticated", async () => {
    authMock.mockResolvedValue(session("OWNER"));
    profileServiceMock.getProfile.mockResolvedValue({ id: "u-1", name: "X" } as never);
    const r = await getProfileAction();
    expect(r.success).toBe(true);
    expect(profileServiceMock.getProfile).toHaveBeenCalledWith("c-1", "u-1");
  });

  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await getProfileAction();
    expect(r.success).toBe(false);
  });
});

/* ================================================================
   updateProfileNameAction
   ================================================================ */

describe("updateProfileNameAction", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await updateProfileNameAction({ name: "X" });
    expect(r.success).toBe(false);
  });

  it("rejects an empty name", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    const r = await updateProfileNameAction({ name: "" });
    expect(r.success).toBe(false);
  });

  it("forwards to the service on success", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    profileServiceMock.updateName.mockResolvedValue({ name: "Joan" });
    const r = await updateProfileNameAction({ name: "Joan" });
    expect(r.success).toBe(true);
    expect(profileServiceMock.updateName).toHaveBeenCalledWith({
      userId: "u-1",
      companyId: "c-1",
      name: "Joan",
    });
  });
});

/* ================================================================
   changePasswordAction
   ================================================================ */

describe("changePasswordAction", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await changePasswordAction({
      currentPassword: "old",
      newPassword: "newP@ss123",
      confirmPassword: "newP@ss123",
    });
    expect(r.success).toBe(false);
  });

  it("rejects when the confirmation does not match", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    const r = await changePasswordAction({
      currentPassword: "old",
      newPassword: "newP@ss123",
      confirmPassword: "different",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a too-short new password", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    const r = await changePasswordAction({
      currentPassword: "old",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(r.success).toBe(false);
  });

  it("maps IncorrectPasswordError to a user-facing error", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    profileServiceMock.changePassword.mockRejectedValue(new IncorrectPasswordError());
    const r = await changePasswordAction({
      currentPassword: "wrong",
      newPassword: "newP@ss123",
      confirmPassword: "newP@ss123",
    });
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/contrasenya|contraseña/i);
  });

  it("maps UserNotFoundError to a user-facing error", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    profileServiceMock.changePassword.mockRejectedValue(new UserNotFoundError());
    const r = await changePasswordAction({
      currentPassword: "old",
      newPassword: "newP@ss123",
      confirmPassword: "newP@ss123",
    });
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/trobat|not found/i);
  });

  it("succeeds on a valid change", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    profileServiceMock.changePassword.mockResolvedValue(undefined);
    const r = await changePasswordAction({
      currentPassword: "old",
      newPassword: "newP@ss123",
      confirmPassword: "newP@ss123",
    });
    expect(r.success).toBe(true);
  });
});

/* ================================================================
   uploadAvatarAction / removeAvatarAction
   ================================================================ */

describe("uploadAvatarAction", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await uploadAvatarAction({
      fileName: "a.png",
      mimeType: "image/png",
      base64: "iVBORw0KGgo=",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an unsupported mime type", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    const r = await uploadAvatarAction({
      fileName: "a.gif",
      mimeType: "image/gif",
      base64: "iVBORw0KGgo=",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty buffer", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    const r = await uploadAvatarAction({
      fileName: "a.png",
      mimeType: "image/png",
      base64: "",
    });
    expect(r.success).toBe(false);
  });

  it("uploads on a valid payload", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    profileServiceMock.getCompanySlug.mockResolvedValue("acme");
    profileServiceMock.uploadAvatar.mockResolvedValue({ avatarUrl: "https://x/a.png" });
    // Build a non-trivial base64 payload (a few KB of zeroes)
    const big = Buffer.alloc(2048, 0).toString("base64");
    const r = await uploadAvatarAction({
      fileName: "a.png",
      mimeType: "image/png",
      base64: big,
    });
    expect(r.success).toBe(true);
    expect(r.data?.avatarUrl).toBe("https://x/a.png");
    expect(profileServiceMock.uploadAvatar).toHaveBeenCalled();
  });

  it("returns a user-friendly error when the company is missing", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    profileServiceMock.getCompanySlug.mockResolvedValue(null);
    const big = Buffer.alloc(2048, 0).toString("base64");
    const r = await uploadAvatarAction({
      fileName: "a.png",
      mimeType: "image/png",
      base64: big,
    });
    expect(r.success).toBe(false);
  });
});

describe("removeAvatarAction", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await removeAvatarAction();
    expect(r.success).toBe(false);
  });

  it("removes on a valid session", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    profileServiceMock.getCompanySlug.mockResolvedValue("acme");
    profileServiceMock.removeAvatar.mockResolvedValue(undefined);
    const r = await removeAvatarAction();
    expect(r.success).toBe(true);
    expect(profileServiceMock.removeAvatar).toHaveBeenCalled();
  });
});
