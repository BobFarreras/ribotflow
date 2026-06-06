/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/team/deactivateUser.ts
 * Description: Marks a user as inactive. They can no longer sign in. Write
 *              access: `team:write` (OWNER only). Cannot deactivate self or
 *              the OWNER. Safety net: refuses to deactivate the last active
 *              member of the company.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { teamService } from "@/services/sat/team";
import { userIdSchema } from "@/lib/validators/sat/teamSchema";
import { TeamError } from "@/lib/errors/team";
import { revalidatePath } from "next/cache";

export async function deactivateUserAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "team:write")) {
      return { success: false, error: "You do not have permission to deactivate users" };
    }

    const parsed = userIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    const updated = await teamService.deactivateUser(
      session.user.companyId,
      parsed.data.userId,
      session.user.id
    );
    revalidatePath("/settings/team");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof TeamError) return { success: false, error: err.message };
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
