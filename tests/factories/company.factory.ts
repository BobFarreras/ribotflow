/**
 * Creation/modification date: 24/05/2026
 * Path: tests/factories/company.factory.ts
 * Description: Factory for generating test company data.
 */

import type { Plan } from "@/types";

export interface CompanyFactoryParams {
  id?: string;
  name?: string;
  tenantSlug?: string;
  plan?: Plan;
}

export function createCompanyFactory(params: CompanyFactoryParams = {}) {
  const name = params.name ?? "Test Company";
  const slug = params.tenantSlug ?? name.toLowerCase().replace(/\s+/g, "-");

  return {
    id: params.id ?? crypto.randomUUID(),
    name,
    tenantSlug: slug,
    plan: params.plan ?? "free",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
