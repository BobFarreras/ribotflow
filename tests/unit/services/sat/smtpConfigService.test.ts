/**
 * Creation/modification date: 01/06/2026
 * Path: tests/unit/services/sat/smtpConfigService.test.ts
 * Description: Unit tests for smtpConfigService with mocked db and nodemailer.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

process.env.ENCRYPTION_KEY = "1nxPRnrSTGRom+3VCvvuBFJZnURaWCp+5KPDq9W9DuU=";

const mocks = vi.hoisted(() => {
  const dbInsert: { values: ReturnType<typeof vi.fn>; returning: ReturnType<typeof vi.fn> } = {
    values: vi.fn(),
    returning: vi.fn(),
  };
  const dbUpdate: { set: ReturnType<typeof vi.fn>; where: ReturnType<typeof vi.fn>; returning: ReturnType<typeof vi.fn> } = {
    set: vi.fn(),
    where: vi.fn(),
    returning: vi.fn(),
  };
  const dbSelect: { from: ReturnType<typeof vi.fn>; where: ReturnType<typeof vi.fn>; limit: ReturnType<typeof vi.fn> } = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  };
  const dbDelete: { where: ReturnType<typeof vi.fn>; returning: ReturnType<typeof vi.fn> } = {
    where: vi.fn(),
    returning: vi.fn(),
  };

  const verify = vi.fn();
  const createTransport = vi.fn(() => ({ verify }));

  return {
    db: { select: dbSelect, insert: dbInsert, update: dbUpdate, delete: dbDelete },
    nodemailer: { verify, createTransport },
  };
});

vi.mock("@/db", () => {
  // All chains return mocks.db.* references (persistent across tests)
  const link = (target: Record<string, unknown>) => {
    target.from = vi.fn(() => target);
    target.where = vi.fn(() => target);
    target.set = vi.fn(() => target);
    target.values = vi.fn(() => target);
    target.limit = vi.fn(() => target);
  };
  link(mocks.db.select);
  link(mocks.db.insert);
  link(mocks.db.update);
  return {
    db: {
      select: vi.fn(() => mocks.db.select),
      insert: vi.fn(() => mocks.db.insert),
      update: vi.fn(() => mocks.db.update),
      delete: vi.fn(() => mocks.db.delete),
    },
  };
});

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ op: "eq", a, b })),
  relations: vi.fn(() => ({})),
}));

vi.mock("nodemailer", () => ({
  default: { createTransport: mocks.nodemailer.createTransport },
}));

import { smtpConfigService } from "@/services/sat/company/smtpConfigService";
import { encrypt, decrypt } from "@/lib/utils/encryption";

const COMPANY_ID = "11111111-1111-1111-1111-111111111111";
const PASSWORD = "Adfama_69";

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "cfg-1",
    companyId: COMPANY_ID,
    host: "smtp.example.com",
    port: 587,
    user: "u@example.com",
    passwordEncrypted: encrypt(PASSWORD),
    secure: false,
    acceptSelfSigned: false,
    fromName: "Acme",
    fromEmail: "noreply@acme.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("smtpConfigService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getByCompany", () => {
    it("returns null when no config exists for the company", async () => {
      mocks.db.select.limit.mockResolvedValueOnce([]);
      const result = await smtpConfigService.getByCompany(COMPANY_ID);
      expect(result).toBeNull();
    });

    it("returns the decrypted config when one exists", async () => {
      mocks.db.select.limit.mockResolvedValueOnce([makeRow()]);
      const result = await smtpConfigService.getByCompany(COMPANY_ID);
      expect(result).not.toBeNull();
      expect(result?.host).toBe("smtp.example.com");
      expect(result?.password).toBe(PASSWORD);
      expect(result?.port).toBe(587);
    });
  });

  describe("upsert", () => {
    it("inserts a new config with encrypted password when none exists", async () => {
      mocks.db.select.limit.mockResolvedValueOnce([]);
      mocks.db.insert.returning.mockResolvedValueOnce([
        { id: "new-id", companyId: COMPANY_ID, host: "smtp.example.com" },
      ]);
      const created = await smtpConfigService.upsert(COMPANY_ID, {
        host: "smtp.example.com",
        port: 587,
        user: "u@example.com",
        password: PASSWORD,
        secure: false,
        acceptSelfSigned: false,
      });
      expect(mocks.db.insert.returning).toHaveBeenCalled();
      expect(created.id).toBe("new-id");
    });

    it("encrypts the password before storing (DB never sees plaintext)", async () => {
      mocks.db.select.limit.mockResolvedValueOnce([]);
      mocks.db.insert.returning.mockResolvedValueOnce([
        { id: "new-id", companyId: COMPANY_ID, host: "smtp.example.com" },
      ]);
      await smtpConfigService.upsert(COMPANY_ID, {
        host: "smtp.example.com",
        port: 587,
        user: "u@example.com",
        password: PASSWORD,
        secure: false,
        acceptSelfSigned: false,
      });
      const valuesArg = mocks.db.insert.values.mock.calls[0][0] as { passwordEncrypted: string };
      expect(valuesArg.passwordEncrypted).not.toBe(PASSWORD);
      expect(valuesArg.passwordEncrypted).toMatch(/^.+:.+:.+$/);
      expect(decrypt(valuesArg.passwordEncrypted)).toBe(PASSWORD);
    });

    it("updates the existing config (preserving password when not provided)", async () => {
      const oldEncrypted = encrypt("old-password");
      mocks.db.select.limit.mockResolvedValueOnce([
        makeRow({ passwordEncrypted: oldEncrypted }),
      ]);
      mocks.db.update.returning.mockResolvedValueOnce([
        { id: "cfg-1", companyId: COMPANY_ID, host: "smtp.example.com" },
      ]);
      await smtpConfigService.upsert(COMPANY_ID, {
        host: "smtp.example.com",
        port: 587,
        user: "u@example.com",
        password: "",
        secure: false,
        acceptSelfSigned: false,
      });
      expect(mocks.db.update.returning).toHaveBeenCalled();
    });

    it("encrypts a new password when explicitly provided in update", async () => {
      const oldEncrypted = encrypt("old");
      mocks.db.select.limit.mockResolvedValueOnce([
        makeRow({ passwordEncrypted: oldEncrypted }),
      ]);
      mocks.db.update.returning.mockResolvedValueOnce([
        { id: "cfg-1", companyId: COMPANY_ID, host: "smtp.example.com" },
      ]);
      await smtpConfigService.upsert(COMPANY_ID, {
        host: "smtp.example.com",
        port: 587,
        user: "u@example.com",
        password: "new-password",
        secure: false,
        acceptSelfSigned: false,
      });
      const setArg = mocks.db.update.set.mock.calls[0][0] as { passwordEncrypted: string };
      expect(setArg.passwordEncrypted).not.toBe("old");
      expect(setArg.passwordEncrypted).not.toBe("new-password");
      expect(decrypt(setArg.passwordEncrypted)).toBe("new-password");
    });
  });

  describe("delete", () => {
    it("removes the config row for the company", async () => {
      mocks.db.delete.returning.mockResolvedValueOnce([{ id: "cfg-1" }]);
      await smtpConfigService.delete(COMPANY_ID);
      expect(mocks.db.delete.where).toHaveBeenCalled();
    });
  });

  describe("testConnection", () => {
    it("returns success=true when verify resolves", async () => {
      mocks.db.select.limit.mockResolvedValueOnce([makeRow()]);
      mocks.nodemailer.verify.mockResolvedValueOnce(true);
      const result = await smtpConfigService.testConnection(COMPANY_ID);
      expect(result.success).toBe(true);
      expect(mocks.nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "smtp.example.com",
          port: 587,
          auth: { user: "u@example.com", pass: PASSWORD },
        })
      );
    });

    it("returns success=false with a clear cert error message when verify rejects with self-signed", async () => {
      mocks.db.select.limit.mockResolvedValueOnce([
        makeRow({ acceptSelfSigned: true }),
      ]);
      mocks.nodemailer.verify.mockRejectedValueOnce(
        new Error("self-signed certificate in certificate chain")
      );
      const result = await smtpConfigService.testConnection(COMPANY_ID);
      expect(result.success).toBe(false);
      expect(result.error).toContain("self-signed");
      expect(result.error).toMatch(/accept_self_signed|Accept self-signed/i);
    });

    it("returns success=false when no config exists for the company", async () => {
      mocks.db.select.limit.mockResolvedValueOnce([]);
      const result = await smtpConfigService.testConnection(COMPANY_ID);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/no smtp config/i);
    });

    it("disables TLS cert validation when acceptSelfSigned is true", async () => {
      mocks.db.select.limit.mockResolvedValueOnce([
        makeRow({ acceptSelfSigned: true }),
      ]);
      mocks.nodemailer.verify.mockResolvedValueOnce(true);
      await smtpConfigService.testConnection(COMPANY_ID);
      expect(mocks.nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({ tls: { rejectUnauthorized: false } })
      );
    });
  });
});
