/**
 * Creation/modification date: 01/06/2026
 * Path: tests/unit/services/notifications/notificationService.test.ts
 * Description: Unit tests for notificationService SMTP config builder and
 *              error handling. Mocks nodemailer to avoid real network calls.
 *              Env vars are mutated per test (service reads them on every call).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { notificationService } from "@/services/notifications/notificationService";

const sendMailMock = vi.fn();
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
  createTransport: createTransportMock,
}));

describe("notificationService.sendEmailWithAttachment — SMTP config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({ messageId: "test-id" });
    createTransportMock.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function baseValidConfig() {
    process.env.SMTP_HOST = "smtp.x.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "u@x.com";
    process.env.SMTP_PASSWORD = "p";
  }

  it("returns error when SMTP_HOST is missing", async () => {
    delete process.env.SMTP_HOST;
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "u@x.com";
    process.env.SMTP_PASSWORD = "p";
    const result = await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("SMTP_HOST");
  });

  it("returns error when SMTP_PASSWORD (not SMTP_PASS) is missing", async () => {
    process.env.SMTP_HOST = "smtp.x.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "u@x.com";
    delete process.env.SMTP_PASSWORD;
    const result = await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("SMTP_PASSWORD");
  });

  it("uses secure=true on port 465 (implicit SSL)", async () => {
    baseValidConfig();
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED = "true";
    await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.x.com",
        port: 465,
        secure: true,
        requireTLS: true,
        auth: { user: "u@x.com", pass: "p" },
        tls: { rejectUnauthorized: true },
      })
    );
  });

  it("uses secure=false and requireTLS=true on port 587 (STARTTLS)", async () => {
    baseValidConfig();
    process.env.SMTP_PORT = "587";
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED = "true";
    await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
        requireTLS: true,
        tls: { rejectUnauthorized: true },
      })
    );
  });

  it("disables TLS cert validation when SMTP_TLS_REJECT_UNAUTHORIZED=false (dev home network fix)", async () => {
    baseValidConfig();
    process.env.SMTP_PORT = "587";
    process.env.SMTP_TLS_REJECT_UNAUTHORIZED = "false";
    await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ tls: { rejectUnauthorized: false } })
    );
  });

  it("disables TLS cert validation when NODE_TLS_REJECT_UNAUTHORIZED=0 (Node-level fallback)", async () => {
    baseValidConfig();
    process.env.SMTP_PORT = "587";
    delete process.env.SMTP_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ tls: { rejectUnauthorized: false } })
    );
  });

  it("returns clear actionable error when sendMail rejects with cert error (with fix instructions)", async () => {
    baseValidConfig();
    sendMailMock.mockRejectedValueOnce(new Error("self-signed certificate in certificate chain"));
    const result = await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("self-signed certificate");
    expect(result.error).toMatch(/SMTP_TLS_REJECT_UNAUTHORIZED|NODE_TLS_REJECT_UNAUTHORIZED/);
  });

  it("returns plain error message for non-cert SMTP errors (no fix instructions)", async () => {
    baseValidConfig();
    sendMailMock.mockRejectedValueOnce(new Error("Invalid login: 535 Authentication failed"));
    const result = await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Authentication failed");
    expect(result.error).not.toMatch(/SMTP_TLS_REJECT_UNAUTHORIZED/);
  });

  it("returns success when sendMail resolves", async () => {
    baseValidConfig();
    const result = await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "Pressupost",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(result.success).toBe(true);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@x.com",
        subject: "Pressupost",
        from: expect.stringContaining("RIBOTFLOW"),
      })
    );
    expect(sendMailMock.mock.calls[0][0]).not.toHaveProperty("attachments");
  });

  it("includes attachment when provided", async () => {
    baseValidConfig();
    const pdfBuffer = Buffer.from("fake-pdf");
    await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "Pressupost",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
      attachment: { filename: "quote.pdf", content: pdfBuffer, contentType: "application/pdf" },
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [{ filename: "quote.pdf", content: pdfBuffer, contentType: "application/pdf" }],
      })
    );
  });

  it("returns the error message when sendMail rejects (e.g. self-signed cert)", async () => {
    baseValidConfig();
    sendMailMock.mockRejectedValueOnce(new Error("self-signed certificate in certificate chain"));
    const result = await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "c1",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("self-signed certificate");
  });
});

// ---------------------------------------------------------------------------
// Per-company DB config (preferred over env)
// ---------------------------------------------------------------------------

vi.mock("@/services/sat/company/smtpConfigService", () => ({
  smtpConfigService: {
    getByCompany: vi.fn(),
  },
}));

import { smtpConfigService } from "@/services/sat/company/smtpConfigService";

describe("notificationService — per-company DB config", () => {
  const originalEnv = { ...process.env };
  const DB_CONFIG = {
    id: "cfg-1",
    companyId: "company-with-db-config",
    host: "smtp.db-host.com",
    port: 587,
    user: "db-user@x.com",
    password: "db-pass",
    secure: false,
    acceptSelfSigned: true,
    fromName: "DB Company",
    fromEmail: "noreply@db-company.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    sendMailMock.mockReset();
    sendMailMock.mockResolvedValue({ messageId: "test-id" });
    createTransportMock.mockClear();
    (smtpConfigService.getByCompany as ReturnType<typeof vi.fn>).mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("prefers DB config over env vars when present", async () => {
    process.env.SMTP_HOST = "smtp.env-host.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "env-user@x.com";
    process.env.SMTP_PASSWORD = "env-pass";
    (smtpConfigService.getByCompany as ReturnType<typeof vi.fn>).mockResolvedValueOnce(DB_CONFIG);
    await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: DB_CONFIG.companyId,
    });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.db-host.com",
        port: 587,
        auth: { user: "db-user@x.com", pass: "db-pass" },
        tls: { rejectUnauthorized: false },
      })
    );
  });

  it("uses 'from' from DB config (overrides payload default)", async () => {
    process.env.SMTP_HOST = "smtp.env-host.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "env-user@x.com";
    process.env.SMTP_PASSWORD = "env-pass";
    (smtpConfigService.getByCompany as ReturnType<typeof vi.fn>).mockResolvedValueOnce(DB_CONFIG);
    await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: DB_CONFIG.companyId,
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: `"DB Company" <noreply@db-company.com>`,
      })
    );
  });

  it("falls back to env vars when company has no DB config (self-hosted compat)", async () => {
    process.env.SMTP_HOST = "smtp.env-host.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "env-user@x.com";
    process.env.SMTP_PASSWORD = "env-pass";
    (smtpConfigService.getByCompany as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "company-without-db-config",
    });
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.env-host.com",
        auth: { user: "env-user@x.com", pass: "env-pass" },
      })
    );
  });

  it("returns helpful error mentioning /settings/email when neither DB nor env is set", async () => {
    (smtpConfigService.getByCompany as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    const result = await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "company-no-config",
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/settings\/email|Configura-ho/);
  });

  it("falls back to env even if DB throws (graceful degradation)", async () => {
    process.env.SMTP_HOST = "smtp.env-host.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "env-user@x.com";
    process.env.SMTP_PASSWORD = "env-pass";
    (smtpConfigService.getByCompany as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("DB connection lost")
    );
    const result = await notificationService.sendQuoteEmail({
      to: "client@x.com",
      subject: "s",
      html: "<p>h</p>",
      quoteNumber: "PRE-1",
      companyId: "any",
    });
    expect(result.success).toBe(true);
    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.env-host.com" })
    );
  });
});
