/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/updateProfile.ts
 * Description: Updates the name of the currently signed-in user.
 *              Any role can update their own name.
 */

"use server";

import { auth } from "@/lib/auth";
import { profileService } from "@/services/sat/profile";
import { updateNameSchema } from "@/lib/validators/sat/profileSchema";
import { revalidatePath } from "next/cache";

export async function updateProfileNameAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = updateNameSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        success: false,
        error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      };
    }

    const result = await profileService.updateName({
      userId: session.user.id,
      companyId: session.user.companyId,
      name: parsed.data.name,
    });
    revalidatePath("/settings/profile");
    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
