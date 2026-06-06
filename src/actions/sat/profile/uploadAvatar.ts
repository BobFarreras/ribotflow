/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/profile/uploadAvatar.ts
 * Description: Server Action to upload the user's avatar. The file is
 *              sent as base64 (same pattern as the company logo). The
 *              image is stored in the configured FileStorage and the
 *              resulting public URL is persisted on users.avatarUrl.
 */

"use server";

import { auth } from "@/lib/auth";
import { profileService } from "@/services/sat/profile";
import { avatarUploadMetaSchema } from "@/lib/validators/sat/profileSchema";
import { revalidatePath } from "next/cache";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function uploadAvatarAction(input: {
  fileName: string;
  mimeType: string;
  base64: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const meta = avatarUploadMetaSchema.safeParse({
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: Math.ceil((input.base64.length * 3) / 4),
    });
    if (!meta.success) {
      const first = meta.error.issues[0];
      return { success: false, error: first?.message ?? "Invalid file" };
    }

    const buffer = Buffer.from(input.base64, "base64");
    if (buffer.length === 0) {
      return { success: false, error: "El fitxer és buit" };
    }
    if (buffer.length > MAX_AVATAR_BYTES) {
      return { success: false, error: "Màxim 2 MB" };
    }

    const tenantSlug = await profileService.getCompanySlug(session.user.companyId);
    if (!tenantSlug) {
      return { success: false, error: "Empresa no trobada" };
    }

    const result = await profileService.uploadAvatar({
      companyId: session.user.companyId,
      userId: session.user.id,
      tenantSlug,
      buffer,
      fileName: meta.data.fileName,
      mimeType: meta.data.mimeType,
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

export async function removeAvatarAction() {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const tenantSlug = await profileService.getCompanySlug(session.user.companyId);
    if (!tenantSlug) {
      return { success: false, error: "Empresa no trobada" };
    }

    await profileService.removeAvatar({
      companyId: session.user.companyId,
      userId: session.user.id,
      tenantSlug,
    });

    revalidatePath("/settings/profile");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
