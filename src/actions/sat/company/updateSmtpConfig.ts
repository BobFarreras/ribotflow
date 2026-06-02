/**
 * Creation/modification date: 01/06/2026
 * Path: src/actions/sat/company/updateSmtpConfig.ts
 * Description: Server Action to upsert the SMTP config for the user's company.
 *              Write access: OWNER only.
 *              If password is "********" (masked from the form), the existing
 *              password is preserved. Otherwise the new password is encrypted
 *              and stored.
 */

"use server";

import { auth } from "@/lib/auth";
import { smtpConfigService } from "@/services/sat/company/smtpConfigService";
import { clearSmtpCache } from "@/services/notifications/notificationService";
import { revalidatePath } from "next/cache";

interface UpdateSmtpInput {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  acceptSelfSigned: boolean;
  fromName?: string | null;
  fromEmail?: string | null;
}

export async function updateSmtpConfigAction(input: UpdateSmtpInput) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "OWNER") {
      return { success: false, error: "Only OWNER can change SMTP config" };
    }

    if (!input.host || !input.user) {
      return { success: false, error: "Host and user are required" };
    }
    if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
      return { success: false, error: "Port must be a number between 1 and 65535" };
    }

    // Preserve existing password if form sent the masked placeholder
    let password = input.password;
    if (password === "********" || password === "") {
      const existing = await smtpConfigService.getByCompany(session.user.companyId);
      if (!existing) {
        return { success: false, error: "Password is required for new SMTP config" };
      }
      password = existing.password;
    }

    const result = await smtpConfigService.upsert(session.user.companyId, {
      host: input.host,
      port: input.port,
      user: input.user,
      password,
      secure: input.secure,
      acceptSelfSigned: input.acceptSelfSigned,
      fromName: input.fromName ?? null,
      fromEmail: input.fromEmail ?? null,
    });

    revalidatePath("/settings/email");
    clearSmtpCache(session.user.companyId);
    return { success: true, data: { id: result.id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
