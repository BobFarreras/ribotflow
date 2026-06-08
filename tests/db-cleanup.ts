/**
 * Creation/modification date: 01/06/2026
 * Path: tests/db-cleanup.ts
 * Description: Cleanup helpers for integration tests. Each test file should
 *              pass a unique slug so parallel test files don't trample each
 *              other's data. Cascading FKs drop the company + users + work
 *              orders + clients + categories atomically.
 */

import { db } from "@/db";
import { companies, users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

export interface CleanupOptions {
  companySlug?: string;
  email?: string;
}

const DEFAULT_COMPANY_SLUG = "test-empresa";
const DEFAULT_EMAIL = "test@ribotflow.local";

/**
 * Removes the seed test company (and all its cascading data) and the test
 * user. Safe to call even if neither exists. Idempotent.
 */
export async function cleanupTestDatabase(options: CleanupOptions = {}): Promise<void> {
  const companySlug = options.companySlug ?? DEFAULT_COMPANY_SLUG;
  const email = options.email ?? DEFAULT_EMAIL;
  try {
    const [company] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.tenantSlug, companySlug))
      .limit(1);

    if (!company) return;

    await db.delete(users).where(eq(users.email, email));
    await db.delete(companies).where(eq(companies.id, company.id));
  } catch (err) {
    console.warn("⚠️  cleanupTestDatabase failed (non-fatal):", err);
  }
}
