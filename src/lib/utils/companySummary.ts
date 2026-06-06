/**
 * Creation/modification date: 02/06/2026
 * Path: src/lib/utils/companySummary.ts
 * Description: Project a CompanySettingsDTO down to the lightweight
 *              CompanySummary the quote editor and PDF preview need.
 *              Used by Server Components (new, [id], [id]/edit) to
 *              pass the real company data down to the editor instead
 *              of the historical "DigitAIStudios" hardcoded stub.
 */

import type { CompanySummary } from "@/components/sat/quotes/types";
import type { CompanySettingsDTO } from "@/components/sat/settings/useCompanySettingsForm";

export function toCompanySummary(dto: CompanySettingsDTO): CompanySummary {
  return {
    name: dto.name,
    taxId: dto.taxId,
    address:
      [dto.addressStreet, dto.addressPostalCode, dto.addressCity].filter(Boolean).join(", ") ||
      null,
    phone: dto.phone,
    email: dto.email,
    website: dto.website,
    logoUrl: dto.logoUrl,
  };
}
