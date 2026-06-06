/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/team/revokeInvitation.ts
 * Description: Cancels a pending invitation by deleting the user row.
 *              Write access: `team:write` (OWNER only). Cannot revoke an
 *              already-accepted invitation.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { teamService } from "@/services/sat/team";
import { userIdSchema } from "@/lib/validators/sat/teamSchema";
import { TeamError } from "@/lib/errors/team";
import { revalidatePath } from "next/cache";

export async function revokeInvitationAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "team:write")) {
      return { success: false, error: "You do not have permission to revoke invitations" };
    }

    const parsed = userIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    await teamService.revokeInvitation(session.user.companyId, parsed.data.userId);
    revalidatePath("/settings/team");
    return { success: true };
  } catch (err) {
    if (err instanceof TeamError) return { success: false, error: err.message };
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
