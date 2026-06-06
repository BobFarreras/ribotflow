/**
 * Creation/modification date: 02/06/2026
 * Path: tests/unit/services/pdf/companyMapper.test.ts
 * Description: Unit tests for the company -> CompanyInfo projection used
 *              by the PDF builders. Pure function, no DB needed.
 */

import { describe, it, expect } from "vitest";
import { mapCompanyToBuilderInfo } from "@/services/pdf/utils/companyMapper";

const baseRow = {
  name: "Reparacions Ribot, SL",
  tenantSlug: "ribot",
  taxId: "B12345678",
  phone: "+34 600 000 000",
  email: "info@ribot.cat",
  website: "https://ribot.cat",
  companyAddress: null,
  addressStreet: null,
  addressCity: null,
  addressPostalCode: null,
  addressCountry: null,
  logoUrl: null,
  legalText: null,
};

describe("mapCompanyToBuilderInfo", () => {
  it("passes through the basic fields verbatim", () => {
    const info = mapCompanyToBuilderInfo(baseRow);
    expect(info.name).toBe("Reparacions Ribot, SL");
    expect(info.taxId).toBe("B12345678");
    expect(info.phone).toBe("+34 600 000 000");
    expect(info.website).toBe("https://ribot.cat");
    expect(info.logoUrl).toBeNull();
    expect(info.legalText).toBeNull();
  });

  it("prefers the explicit companies.email over the legacy slug fallback", () => {
    const info = mapCompanyToBuilderInfo(baseRow);
    expect(info.email).toBe("info@ribot.cat");
  });

  it("falls back to info@{slug}.com when no explicit email is set", () => {
    const row = { ...baseRow, email: null };
    const info = mapCompanyToBuilderInfo(row);
    expect(info.email).toBe("info@ribot.com");
  });

  it("returns null email when neither the explicit value nor a slug is set", () => {
    const row = { ...baseRow, email: null, tenantSlug: "" };
    const info = mapCompanyToBuilderInfo(row);
    expect(info.email).toBeNull();
  });

  it("composes the structured address with postal code + city + country", () => {
    const row = {
      ...baseRow,
      addressStreet: "Carrer Nou 15",
      addressPostalCode: "17100",
      addressCity: "La Bisbal d'Empordà",
      addressCountry: "ES",
    };
    const info = mapCompanyToBuilderInfo(row);
    expect(info.address).toBe("Carrer Nou 15, 17100, La Bisbal d'Empordà (ES)");
  });

  it("falls back to the legacy companyAddress when structured fields are empty", () => {
    const row = { ...baseRow, companyAddress: "Carrer Vell 1, 17001 Girona" };
    const info = mapCompanyToBuilderInfo(row);
    expect(info.address).toBe("Carrer Vell 1, 17001 Girona");
  });

  it("omits the country tag when the value is not a 2-letter ISO code", () => {
    const row = {
      ...baseRow,
      addressStreet: "X",
      addressCity: "Y",
      addressCountry: "España",
    };
    const info = mapCompanyToBuilderInfo(row);
    expect(info.address).toBe("X, Y");
  });
});
