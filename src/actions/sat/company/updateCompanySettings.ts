/**
 * Creation/modification date: 02/06/2026
 * Path: src/actions/sat/company/updateCompanySettings.ts
 * Description: Server Action to update the company's settings (identity, address,
 *              preferences, documents, branding). Write access: OWNER only.
 *              Validates the input with Zod before persisting.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { companySettingsService } from "@/services/sat/company/companySettingsService";
import { companySettingsSchema, type CompanySettingsInput } from "@/lib/validators/sat/companySchema";
import { revalidatePath } from "next/cache";

export async function updateCompanySettingsAction(input: CompanySettingsInput) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "company:write")) {
      return { success: false, error: "You do not have permission to change company settings" };
    }

    const parsed = companySettingsSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        success: false,
        error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      };
    }

    const dto = await companySettingsService.update(session.user.companyId, parsed.data);
    revalidatePath("/settings/company");
    return { success: true, data: dto };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
