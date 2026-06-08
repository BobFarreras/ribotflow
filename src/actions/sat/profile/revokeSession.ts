/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/revokeSession.ts
 * Description: Server Action that revokes a single session for the
 *              signed-in user. Refuses to revoke the current session
 *              (identified by user-agent + IP fingerprint).
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  sessionsService,
  CannotRevokeCurrentSessionError,
  SessionNotFoundError,
} from "@/services/sat/sessions";
import { sessionIdSchema } from "@/lib/validators/sat/sessionsSchema";
import { getCurrentSessionFingerprint } from "@/lib/auth/currentSession";
import { getTranslations } from "next-intl/server";

export async function revokeSessionAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized" };
    }
    const parsed = sessionIdSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, error: "Invalid input" };
    }
    const fingerprint = await getCurrentSessionFingerprint();
    try {
      await sessionsService.revokeSession(
        session.user.id,
        parsed.data.sessionId,
        fingerprint
      );
    } catch (err) {
      if (err instanceof CannotRevokeCurrentSessionError) {
        const t = await getTranslations("sat.settings.profile.sessions");
        return {
          success: false as const,
          error: t("errors.cannotRevokeCurrent"),
        };
      }
      if (err instanceof SessionNotFoundError) {
        return { success: false as const, error: "Session not found" };
      }
      throw err;
    }
    revalidatePath("/settings/profile");
    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
