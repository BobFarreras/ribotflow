/**
 * Creation/modification date: 02/06/2026
 * Path: tests/unit/actions/sat/company/updateCompanySettingsAction.test.ts
 * Description: Verifies that the permission-gated Server Actions in
 *              src/actions/sat/company refuse every role that should be
 *              denied and let the expected role through. Uses real
 *              Auth.js session and real DB; mocks only the action body
 *              so we never persist any test data.
 *
 *              We do not seed the database — these tests just exercise
 *              the early permission check (the first thing the action
 *              does after `auth()`), which never reaches the service.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: authMock }));

// Stub the service so we never persist data even if the gate passed.
vi.mock("@/services/sat/company/companySettingsService", () => ({
  companySettingsService: {
    update: vi.fn().mockResolvedValue({ id: "x" }),
    getById: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/services/sat/company/smtpConfigService", () => ({
  smtpConfigService: {
    testConnection: vi.fn().mockResolvedValue({ success: true }),
    getByCompany: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue({ id: "x" }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/services/notifications/notificationService", () => ({
  clearSmtpCache: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateCompanySettingsAction } from "@/actions/sat/company/updateCompanySettings";
import { getCompanySettingsAction } from "@/actions/sat/company/getCompanySettings";
import { uploadCompanyLogoAction, removeCompanyLogoAction } from "@/actions/sat/company/uploadCompanyLogo";
import { updateSmtpConfigAction } from "@/actions/sat/company/updateSmtpConfig";
import { deleteSmtpConfigAction } from "@/actions/sat/company/deleteSmtpConfig";
import { getSmtpConfigAction } from "@/actions/sat/company/getSmtpConfig";
import { testSmtpConnectionAction } from "@/actions/sat/company/testSmtpConnection";
import type { CompanySettingsInput } from "@/lib/validators/sat/companySchema";

function session(role: "OWNER" | "ADMIN" | "OFFICE" | "TECHNICIAN" | null) {
  if (role === null) return null;
  return {
    user: {
      id: "u-1",
      companyId: "c-1",
      role,
      email: "x@x.com",
      name: "X",
    },
  };
}

beforeEach(() => {
  authMock.mockReset();
});

describe("updateCompanySettingsAction — company:write gate", () => {
  it.each([
    ["ADMIN", false],
    ["OFFICE", false],
    ["TECHNICIAN", false],
  ] as const)("blocks %s", async (role, expected) => {
    authMock.mockResolvedValue(session(role));
    const res = await updateCompanySettingsAction({ name: "X" } as CompanySettingsInput);
    expect(res.success).toBe(expected);
  });

  it("allows OWNER — gate passes, service (mocked) is reached", async () => {
    authMock.mockResolvedValue(session("OWNER"));
    const res = await updateCompanySettingsAction({
      name: "Test Co",
      taxId: "B12345678",
      phone: null,
      email: null,
      website: null,
      addressStreet: null,
      addressCity: null,
      addressPostalCode: null,
      addressCountry: "ES",
      legalText: null,
      defaultTaxRate: 21,
      defaultCurrency: "EUR",
      defaultLocale: "ca",
      timezone: "Europe/Madrid",
      quotePrefix: "PRE",
      invoicePrefix: "INV",
      travelRatePerKm: null,
    });
    expect(res.success).toBe(true);
  });

  it("rejects an unauthenticated request", async () => {
    authMock.mockResolvedValue(null);
    const res = await updateCompanySettingsAction({ name: "X" } as CompanySettingsInput);
    expect(res).toEqual({ success: false, error: "Unauthorized" });
  });
});

describe("getCompanySettingsAction — company:read gate", () => {
  it.each([
    "OWNER",
    "ADMIN",
    "OFFICE",
    "TECHNICIAN", // matrix: every role can read company
  ] as const)("allows %s", async (role) => {
    authMock.mockResolvedValue(session(role));
    const res = await getCompanySettingsAction();
    expect(res.success).toBe(true);
  });

  it("rejects an unauthenticated request", async () => {
    authMock.mockResolvedValue(null);
    const res = await getCompanySettingsAction();
    expect(res).toEqual({ success: false, error: "Unauthorized" });
  });
});

describe("uploadCompanyLogoAction — company:write gate", () => {
  it.each([
    "ADMIN",
    "OFFICE",
    "TECHNICIAN",
  ] as const)("blocks %s", async (role) => {
    authMock.mockResolvedValue(session(role));
    const res = await uploadCompanyLogoAction({ fileName: "f", mimeType: "image/png", base64: "" });
    expect(res.success).toBe(false);
  });

  it("blocks OFFICE for removeCompanyLogoAction", async () => {
    authMock.mockResolvedValue(session("OFFICE"));
    const res = await removeCompanyLogoAction();
    expect(res.success).toBe(false);
  });

  it("blocks TECHNICIAN for removeCompanyLogoAction", async () => {
    authMock.mockResolvedValue(session("TECHNICIAN"));
    const res = await removeCompanyLogoAction();
    expect(res.success).toBe(false);
  });
});

describe("SMTP actions — email:read / email:write gate", () => {
  it("getSmtpConfigAction allows only OWNER, blocks ADMIN/OFFICE/TECHNICIAN", async () => {
    authMock.mockResolvedValue(session("OWNER"));
    const res = await getSmtpConfigAction();
    expect(res.success, "OWNER should pass read gate").toBe(true);

    for (const role of ["ADMIN", "OFFICE", "TECHNICIAN"] as const) {
      authMock.mockResolvedValue(session(role));
      const res = await getSmtpConfigAction();
      expect(res.success, `${role} should be blocked`).toBe(false);
    }
  });

  it("testSmtpConnectionAction allows only OWNER, blocks ADMIN/OFFICE/TECHNICIAN", async () => {
    authMock.mockResolvedValue(session("OWNER"));
    const res = await testSmtpConnectionAction();
    expect(res.success, "OWNER should pass read gate").toBe(true);

    for (const role of ["ADMIN", "OFFICE", "TECHNICIAN"] as const) {
      authMock.mockResolvedValue(session(role));
      const res = await testSmtpConnectionAction();
      expect(res.success, `${role} should be blocked`).toBe(false);
    }
  });

  it("updateSmtpConfigAction allows only OWNER (matrix denies ADMIN:email:write)", async () => {
    authMock.mockResolvedValue(session("OWNER"));
    const res = await updateSmtpConfigAction({ host: "x", port: 587, user: "u", password: "p", secure: false, acceptSelfSigned: false });
    expect(res.success).toBe(true);

    authMock.mockResolvedValue(session("ADMIN"));
    const res2 = await updateSmtpConfigAction({ host: "x", port: 587, user: "u", password: "p", secure: false, acceptSelfSigned: false });
    expect(res2.success).toBe(false);
  });

  it("deleteSmtpConfigAction allows only OWNER", async () => {
    authMock.mockResolvedValue(session("OWNER"));
    const res = await deleteSmtpConfigAction();
    expect(res.success).toBe(true);

    for (const role of ["ADMIN", "OFFICE", "TECHNICIAN"] as const) {
      authMock.mockResolvedValue(session(role));
      const r = await deleteSmtpConfigAction();
      expect(r.success, `${role} should be blocked from deleting SMTP`).toBe(false);
    }
  });
});
