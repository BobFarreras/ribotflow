/**
 * Creation/modification date: 02/06/2026
 * Path: src/actions/sat/company/uploadCompanyLogo.ts
 * Description: Server Action to upload a company logo. The file is sent as
 *              base64 in the form (avoids needing a separate upload endpoint).
 *              Write access: OWNER only.
 *              Stores in the configured FileStorage (MinIO/Supabase/Local) and
 *              persists the resulting public URL on companies.logoUrl.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { db } from "@/db";
import { companies } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { companySettingsService } from "@/services/sat/company/companySettingsService";
import { logoUploadMetaSchema } from "@/lib/validators/sat/companySchema";
import { revalidatePath } from "next/cache";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export async function uploadCompanyLogoAction(input: {
  fileName: string;
  mimeType: string;
  base64: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "company:write")) {
      return { success: false, error: "You do not have permission to change the logo" };
    }

    const meta = logoUploadMetaSchema.safeParse({
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
    if (buffer.length > MAX_LOGO_BYTES) {
      return { success: false, error: "Màxim 2 MB" };
    }

    // Fetch tenant slug for storage key building.
    const rows = await db
      .select({ tenantSlug: companies.tenantSlug })
      .from(companies)
      .where(eq(companies.id, session.user.companyId))
      .limit(1);
    if (!rows[0]) {
      return { success: false, error: "Empresa no trobada" };
    }

    const { publicUrl } = await companySettingsService.uploadLogo(
      session.user.companyId,
      rows[0].tenantSlug,
      buffer,
      meta.data.fileName,
      meta.data.mimeType
    );

    await db
      .update(companies)
      .set({ logoUrl: publicUrl, updatedAt: new Date() })
      .where(eq(companies.id, session.user.companyId));

    revalidatePath("/settings/company");
    return { success: true, data: { logoUrl: publicUrl } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function removeCompanyLogoAction() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "company:write")) {
      return { success: false, error: "You do not have permission to remove the logo" };
    }
    await db
      .update(companies)
      .set({ logoUrl: null, updatedAt: new Date() })
      .where(eq(companies.id, session.user.companyId));
    revalidatePath("/settings/company");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
