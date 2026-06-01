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
