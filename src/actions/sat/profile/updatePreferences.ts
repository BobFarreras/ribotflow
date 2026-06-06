/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/updatePreferences.ts
 * Description: Server Action that updates the signed-in user's theme and/or
 *              UI locale. Also writes the matching cookies so the next
 *              request can render the right <html lang> and the
 *              anti-FOUC <script> can apply the correct `.dark` class
 *              before the first paint.
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { preferencesService } from "@/services/sat/preferences";
import { updatePreferencesSchema } from "@/lib/validators/sat/preferencesSchema";
import {
  writeThemeCookie,
  writeLocaleCookie,
} from "@/lib/cookies/preferencesCookies";

export async function updatePreferencesAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized" };
    }

    const parsed = updatePreferencesSchema.safeParse(input);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return {
        success: false as const,
        error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      };
    }

    const data = await preferencesService.upsertUserPreferences({
      userId: session.user.id,
      theme: parsed.data.theme,
      locale: parsed.data.locale,
    });

    if (parsed.data.theme) writeThemeCookie(parsed.data.theme);
    if (parsed.data.locale) writeLocaleCookie(parsed.data.locale);

    revalidatePath("/", "layout");

    return { success: true as const, data };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
