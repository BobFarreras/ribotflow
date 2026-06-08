/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/changePassword.ts
 * Description: Changes the password of the currently signed-in user.
 *              Verifies the current password before hashing and storing
 *              the new one.
 */

"use server";

import { auth } from "@/lib/auth";
import { profileService } from "@/services/sat/profile";
import { changePasswordSchema } from "@/lib/validators/sat/profileSchema";
import { IncorrectPasswordError, UserNotFoundError } from "@/lib/errors/profile";

export async function changePasswordAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        success: false,
        error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      };
    }

    await profileService.changePassword({
      userId: session.user.id,
      companyId: session.user.companyId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });

    return { success: true };
  } catch (err) {
    if (err instanceof IncorrectPasswordError) {
      return { success: false, error: "La contrasenya actual no és correcta" };
    }
    if (err instanceof UserNotFoundError) {
      return { success: false, error: "Usuari no trobat" };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
