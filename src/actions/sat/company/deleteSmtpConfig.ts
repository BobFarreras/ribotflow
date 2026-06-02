/**
 * Creation/modification date: 01/06/2026
 * Path: src/actions/sat/company/deleteSmtpConfig.ts
 * Description: Server Action to delete the SMTP config for the current company.
 *              After this, the notificationService falls back to SMTP_* env vars
 *              (or fails if those are not set either).
 *              OWNER only.
 */

"use server";

import { auth } from "@/lib/auth";
import { smtpConfigService } from "@/services/sat/company/smtpConfigService";
import { clearSmtpCache } from "@/services/notifications/notificationService";
import { revalidatePath } from "next/cache";

export async function deleteSmtpConfigAction() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "OWNER") {
      return { success: false, error: "Only OWNER can delete SMTP config" };
    }
    await smtpConfigService.delete(session.user.companyId);
    clearSmtpCache(session.user.companyId);
    revalidatePath("/settings/email");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
