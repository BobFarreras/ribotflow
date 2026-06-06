/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/team/reactivateUser.ts
 * Description: Reactivates a previously deactivated user. Write access:
 *              `team:write` (OWNER only). Owner can never be deactivated,
 *              so the same check applies here.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { teamService } from "@/services/sat/team";
import { userIdSchema } from "@/lib/validators/sat/teamSchema";
import { TeamError } from "@/lib/errors/team";
import { revalidatePath } from "next/cache";

export async function reactivateUserAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "team:write")) {
      return { success: false, error: "You do not have permission to reactivate users" };
    }

    const parsed = userIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    const updated = await teamService.reactivateUser(session.user.companyId, parsed.data.userId);
    revalidatePath("/settings/team");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof TeamError) return { success: false, error: err.message };
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
