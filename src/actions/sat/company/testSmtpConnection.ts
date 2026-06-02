/**
 * Creation/modification date: 01/06/2026
 * Path: src/actions/sat/company/testSmtpConnection.ts
 * Description: Server Action to verify the SMTP connection for the current
 *              company's config. Useful as a "Test connection" button before
 *              saving. OWNER/ADMIN can run.
 */

"use server";

import { auth } from "@/lib/auth";
import { smtpConfigService } from "@/services/sat/company/smtpConfigService";

export async function testSmtpConnectionAction() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return { success: false, error: "Only OWNER/ADMIN can test SMTP connection" };
    }
    return await smtpConfigService.testConnection(session.user.companyId);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
