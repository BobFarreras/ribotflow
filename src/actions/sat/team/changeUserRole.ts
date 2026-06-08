/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/team/changeUserRole.ts
 * Description: Changes a user's role within the current company. Write
 *              access: `team:write` (OWNER only). Cannot change the OWNER
 *              or the caller's own role.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { teamService } from "@/services/sat/team";
import { changeUserRoleSchema } from "@/lib/validators/sat/teamSchema";
import { TeamError } from "@/lib/errors/team";
import { revalidatePath } from "next/cache";

export async function changeUserRoleAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "team:write")) {
      return { success: false, error: "You do not have permission to change roles" };
    }

    const parsed = changeUserRoleSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        success: false,
        error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      };
    }

    const updated = await teamService.changeUserRole(
      session.user.companyId,
      parsed.data.userId,
      parsed.data.role,
      session.user.id
    );
    revalidatePath("/settings/team");
    return { success: true, data: updated };
  } catch (err) {
    if (err instanceof TeamError) return { success: false, error: err.message };
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
