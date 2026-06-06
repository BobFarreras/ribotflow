/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/team/acceptInvitation.ts
 * Description: Public Server Action that finalises an invitation. Does
 *              NOT require an authenticated session — the token in the
 *              form is the credential. On success returns the email of
 *              the user that just completed onboarding so the page
 *              can call `signIn(credentials)` to log them in.
 */

"use server";

import { teamService } from "@/services/sat/team";
import { acceptInvitationSchema } from "@/lib/validators/sat/invitationSchema";
import { InvalidInvitationTokenError, NotAPendingUserError } from "@/lib/errors/team";
import { PasswordTooShortError } from "@/lib/errors/profile";

export async function acceptInvitationAction(input: unknown) {
  try {
    const parsed = acceptInvitationSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        success: false as const,
        error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      };
    }

    const result = await teamService.acceptInvitation({
      token: parsed.data.token,
      password: parsed.data.password,
    });
    return {
      success: true as const,
      data: { email: result.member.email, name: result.member.name },
    };
  } catch (err) {
    if (err instanceof InvalidInvitationTokenError) {
      return { success: false as const, error: "INVALID_TOKEN" };
    }
    if (err instanceof NotAPendingUserError) {
      return { success: false as const, error: "ALREADY_ACCEPTED" };
    }
    if (err instanceof PasswordTooShortError) {
      return { success: false as const, error: "PASSWORD_TOO_SHORT" };
    }
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
