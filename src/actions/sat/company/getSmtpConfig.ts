/**
 * Creation/modification date: 01/06/2026
 * Path: src/actions/sat/company/getSmtpConfig.ts
 * Description: Server Action to fetch the current SMTP config for the user's company.
 *              Returns the config with the password masked (never sent to the client).
 *              Read access: OWNER, ADMIN.
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { smtpConfigService } from "@/services/sat/company/smtpConfigService";

export async function getSmtpConfigAction() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (!can(session.user.role, "email:read")) {
      return { success: false, error: "You do not have permission to view SMTP config" };
    }

    const cfg = await smtpConfigService.getByCompany(session.user.companyId);
    if (!cfg) {
      return { success: true, data: null };
    }
    return {
      success: true,
      data: {
        id: cfg.id,
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: "********",
        secure: cfg.secure,
        acceptSelfSigned: cfg.acceptSelfSigned,
        fromName: cfg.fromName,
        fromEmail: cfg.fromEmail,
        updatedAt: cfg.updatedAt,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
