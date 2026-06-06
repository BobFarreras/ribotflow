/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/team/resendInvitation.ts
 * Description: Issues a fresh token and extends the expiry for a pending
 *              invitation. Write access: `team:write` (OWNER only).
 *              Returns the new invitation URL in dev/self-hosted mode.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { teamService } from "@/services/sat/team";
import { userIdSchema } from "@/lib/validators/sat/teamSchema";
import { TeamError } from "@/lib/errors/team";
import { revalidatePath } from "next/cache";

export interface ResendInvitationResult {
  success: boolean;
  error?: string;
  invitationUrl?: string;
}

export async function resendInvitationAction(
  input: unknown,
  appBaseUrl?: string
): Promise<ResendInvitationResult> {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "team:write")) {
      return { success: false, error: "You do not have permission to resend invitations" };
    }

    const parsed = userIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    const { invitationToken } = await teamService.resendInvitation(
      session.user.companyId,
      parsed.data.userId
    );
    revalidatePath("/settings/team");

    if (process.env.NEXT_PUBLIC_APP_MODE === "cloud") {
      // TODO PR-future: send invitation email
      return { success: true };
    }

    const base = appBaseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return {
      success: true,
      invitationUrl: `${base}/accept-invitation?token=${invitationToken}`,
    };
  } catch (err) {
    if (err instanceof TeamError) return { success: false, error: err.message };
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
