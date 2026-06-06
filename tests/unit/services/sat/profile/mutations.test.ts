/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/services/sat/profile/mutations.test.ts
 * Description: Pure unit tests for the profile mutations service. Mocks
 *              the Drizzle `db` instance and the FileStorage factory so
 *              we can assert business logic without a real DB or bucket.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => {
  const chain = {
    select: vi.fn(),
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    returning: vi.fn(),
    and: vi.fn((...args: unknown[]) => args),
  };
  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.set.mockReturnValue(chain);
  return chain;
});

const storageMock = vi.hoisted(() => ({
  upload: vi.fn(),
  delete: vi.fn(),
  getPublicUrl: vi.fn(),
  exists: vi.fn(),
  listObjects: vi.fn(),
}));

vi.mock("@/db", () => ({ db: dbMock }));
vi.mock("@/services/storage/factory", () => ({
  createFileStorage: () => storageMock,
}));

import { updateName, changePassword, uploadAvatar, removeAvatar, getCompanySlug } from "@/services/sat/profile/mutations";
import { IncorrectPasswordError, UserNotFoundError } from "@/lib/errors/profile";

const COMPANY = "c-1";
const USER = "u-1";

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.select.mockReturnValue(dbMock);
  dbMock.from.mockReturnValue(dbMock);
  dbMock.innerJoin.mockReturnValue(dbMock);
  dbMock.where.mockReturnValue(dbMock);
  dbMock.update.mockReturnValue(dbMock);
  dbMock.set.mockReturnValue(dbMock);
  storageMock.upload.mockResolvedValue({
    storageKey: "branding/acme/avatars/u-1-123.png",
    publicUrl: "https://cdn/acme/avatars/u-1-123.png",
  });
});

/* ================================================================
   updateName
   ================================================================ */

describe("updateName", () => {
  it("updates the name and returns the new value", async () => {
    dbMock.returning.mockResolvedValueOnce([{ name: "New Name" }]);
    const r = await updateName({ companyId: COMPANY, userId: USER, name: "New Name" });
    expect(r.name).toBe("New Name");
    expect(dbMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New Name" })
    );
  });

  it("throws UserNotFoundError when the user does not exist", async () => {
    dbMock.returning.mockReset();
    dbMock.returning.mockResolvedValueOnce([]);
    await expect(
      updateName({ companyId: COMPANY, userId: USER, name: "X" })
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

/* ================================================================
   changePassword
   ================================================================ */

describe("changePassword", () => {
  it("hashes and persists the new password when the current one matches", async () => {
    // getPasswordHash returns a known hash
    dbMock.limit.mockResolvedValueOnce([{ passwordHash: "OLDHASH" }]);
    // The verification of the password is real (bcrypt) — use a known hash.
    const { hashPassword, verifyPassword } = await import("@/lib/utils/crypto");
    const valid = await hashPassword("currentP@ss");
    dbMock.limit.mockReset();
    dbMock.limit.mockResolvedValueOnce([{ passwordHash: valid }]);

    await changePassword({
      companyId: COMPANY,
      userId: USER,
      currentPassword: "currentP@ss",
      newPassword: "brandNewP@ss",
    });

    expect(dbMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: expect.any(String) })
    );
    // The new hash must verify
    const newHash = dbMock.set.mock.calls[0][0].passwordHash as string;
    expect(await verifyPassword("brandNewP@ss", newHash)).toBe(true);
  });

  it("throws IncorrectPasswordError on a wrong current password", async () => {
    const { hashPassword } = await import("@/lib/utils/crypto");
    const valid = await hashPassword("correct");
    dbMock.limit.mockResolvedValueOnce([{ passwordHash: valid }]);
    await expect(
      changePassword({
        companyId: COMPANY,
        userId: USER,
        currentPassword: "wrong",
        newPassword: "brandNewP@ss",
      })
    ).rejects.toBeInstanceOf(IncorrectPasswordError);
  });

  it("throws UserNotFoundError when the user has no password (pending)", async () => {
    dbMock.limit.mockResolvedValueOnce([{ passwordHash: null }]);
    await expect(
      changePassword({
        companyId: COMPANY,
        userId: USER,
        currentPassword: "x",
        newPassword: "brandNewP@ss",
      })
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("throws UserNotFoundError when the user does not exist", async () => {
    dbMock.limit.mockResolvedValueOnce([]);
    await expect(
      changePassword({
        companyId: COMPANY,
        userId: USER,
        currentPassword: "x",
        newPassword: "brandNewP@ss",
      })
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});

/* ================================================================
   uploadAvatar
   ================================================================ */

describe("uploadAvatar", () => {
  it("uploads and persists the public URL", async () => {
    const r = await uploadAvatar({
      companyId: COMPANY,
      userId: USER,
      tenantSlug: "acme",
      buffer: Buffer.from([0xff, 0xd8, 0xff]),
      fileName: "avatar.png",
      mimeType: "image/png",
    });
    expect(r.avatarUrl).toContain("avatars/u-1-");
    expect(storageMock.upload).toHaveBeenCalled();
    expect(dbMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: expect.any(String) })
    );
  });

  it("rejects an unsupported mime type", async () => {
    await expect(
      uploadAvatar({
        companyId: COMPANY,
        userId: USER,
        tenantSlug: "acme",
        buffer: Buffer.from([1, 2, 3]),
        fileName: "avatar.gif",
        mimeType: "image/gif",
      })
    ).rejects.toThrow(/Unsupported/);
  });

  it("rejects an empty buffer", async () => {
    await expect(
      uploadAvatar({
        companyId: COMPANY,
        userId: USER,
        tenantSlug: "acme",
        buffer: Buffer.alloc(0),
        fileName: "avatar.png",
        mimeType: "image/png",
      })
    ).rejects.toThrow(/Empty/);
  });

  it("rejects files larger than 2 MB", async () => {
    await expect(
      uploadAvatar({
        companyId: COMPANY,
        userId: USER,
        tenantSlug: "acme",
        buffer: Buffer.alloc(3 * 1024 * 1024),
        fileName: "big.png",
        mimeType: "image/png",
      })
    ).rejects.toThrow(/too large/i);
  });
});

/* ================================================================
   removeAvatar
   ================================================================ */

describe("removeAvatar", () => {
  it("clears the avatarUrl on the user row", async () => {
    await removeAvatar({ companyId: COMPANY, userId: USER, tenantSlug: "acme" });
    expect(dbMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: null })
    );
  });

  it("deletes only the most recent previous avatar object (best-effort cleanup)", async () => {
    storageMock.listObjects.mockResolvedValueOnce([
      "branding/acme/avatars/u-1-001.png",
      "branding/acme/avatars/u-1-002.png",
      "branding/acme/avatars/u-1-003.png",
    ]);
    await removeAvatar({ companyId: COMPANY, userId: USER, tenantSlug: "acme" });
    expect(storageMock.listObjects).toHaveBeenCalledWith(`branding/acme/avatars/${USER}-`);
    // Implementation deletes ONLY the newest key (sorted alphabetically) to
    // keep the test deterministic and the side-effect minimal.
    expect(storageMock.delete).toHaveBeenCalledTimes(1);
    expect(storageMock.delete).toHaveBeenCalledWith("branding/acme/avatars/u-1-003.png");
  });

  it("swallows storage errors silently (best-effort)", async () => {
    storageMock.listObjects.mockRejectedValueOnce(new Error("S3 down"));
    await expect(
      removeAvatar({ companyId: COMPANY, userId: USER, tenantSlug: "acme" })
    ).resolves.toBeUndefined();
    expect(dbMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: null })
    );
  });
});

/* ================================================================
   getCompanySlug
   ================================================================ */

describe("getCompanySlug", () => {
  it("returns the slug when the company exists", async () => {
    dbMock.limit.mockResolvedValueOnce([{ tenantSlug: "acme" }]);
    const slug = await getCompanySlug(COMPANY);
    expect(slug).toBe("acme");
  });

  it("returns null when the company does not exist", async () => {
    dbMock.limit.mockResolvedValueOnce([]);
    const slug = await getCompanySlug("missing");
    expect(slug).toBeNull();
  });
});
