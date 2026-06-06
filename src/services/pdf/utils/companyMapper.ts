/**
 * Creation/modification date: 02/06/2026
 * Path: src/services/pdf/utils/companyMapper.ts
 * Description: Maps a database `companies` row to the CompanyInfo the
 *              PDF builders consume. Single source of truth so the
 *              header, info section and conditions box all read from
 *              the same projection.
 */

import type { CompanyInfo } from "../types";

type CompanyRow = {
  name: string;
  tenantSlug: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  companyAddress: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  logoUrl: string | null;
  legalText: string | null;
};

/** Joins the structured address fields with a comma. Falls back to the
 *  legacy `companyAddress` text for tenants that haven't migrated. */
function composeAddress(row: CompanyRow): string | null {
  const parts = [row.addressStreet, row.addressPostalCode, row.addressCity].filter(Boolean);
  if (parts.length > 0) {
    const country =
      row.addressCountry && row.addressCountry.length === 2 ? row.addressCountry : null;
    return country ? `${parts.join(", ")} (${country})` : parts.join(", ");
  }
  return row.companyAddress;
}

/** Email priority: explicit `companies.email` (always wins), otherwise
 *  the legacy `info@{slug}.com` fallback used by tenants that never set
 *  a contact email. */
function resolveEmail(row: CompanyRow): string | null {
  if (row.email) return row.email;
  if (row.tenantSlug) return `info@${row.tenantSlug}.com`;
  return null;
}

export function mapCompanyToBuilderInfo(row: CompanyRow): CompanyInfo {
  return {
    name: row.name,
    address: composeAddress(row),
    phone: row.phone,
    email: resolveEmail(row),
    website: row.website,
    taxId: row.taxId,
    logoUrl: row.logoUrl,
    legalText: row.legalText,
  };
}
