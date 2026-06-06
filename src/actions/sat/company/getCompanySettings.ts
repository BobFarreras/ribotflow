/**
 * Creation/modification date: 02/06/2026
 * Path: src/actions/sat/company/getCompanySettings.ts
 * Description: Server Action to fetch the current company's settings DTO.
 *              Read access: OWNER, ADMIN.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { companySettingsService } from "@/services/sat/company/companySettingsService";

export async function getCompanySettingsAction() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "company:read")) {
      return { success: false, error: "You do not have permission to view company settings" };
    }

    const dto = await companySettingsService.getById(session.user.companyId);
    return { success: true, data: dto };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
