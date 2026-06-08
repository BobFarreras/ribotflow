/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/team/inviteUser.ts
 * Description: Invites a new user to the current company. Write access:
 *              `team:write` (OWNER only). The user is created with
 *              status="pending" and a 7-day invitation token.
 *
 *              In dev/self-hosted mode the invitation URL is returned to
 *              the client so the developer can copy/paste it. In cloud
 *              mode an email is sent via the notification service.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { teamService } from "@/services/sat/team";
import { inviteUserSchema } from "@/lib/validators/sat/teamSchema";
import { TeamError } from "@/lib/errors/team";
import { revalidatePath } from "next/cache";
import { notificationService } from "@/services/notifications/notificationService";

export interface InviteUserResult {
  success: boolean;
  error?: string;
  /** Only populated in dev mode. In cloud mode the email is sent instead. */
  invitationUrl?: string;
  /** In cloud mode, whether the invitation email was sent successfully. */
  emailSent?: boolean;
}

export async function inviteUserAction(
  input: unknown,
  appBaseUrl?: string
): Promise<InviteUserResult> {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "team:write")) {
      return { success: false, error: "You do not have permission to invite users" };
    }

    const parsed = inviteUserSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        success: false,
        error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      };
    }

    const result = await teamService.inviteUser({
      companyId: session.user.companyId,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      invitedBy: session.user.id,
    });

    revalidatePath("/settings/team");

    const base = appBaseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const invitationUrl = `${base}/accept-invitation?token=${result.invitationToken}`;

    if (process.env.NEXT_PUBLIC_APP_MODE === "cloud") {
      const emailResult = await notificationService.sendInvitationEmail(session.user.companyId, {
        inviteeName: parsed.data.name,
        inviteeEmail: parsed.data.email,
        invitedByName: session.user.name ?? session.user.email ?? "Admin",
        invitationUrl,
        role: parsed.data.role,
      });
      return { success: true, emailSent: emailResult.success, error: emailResult.error };
    }

    return {
      success: true,
      invitationUrl,
    };
  } catch (err) {
    if (err instanceof TeamError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
