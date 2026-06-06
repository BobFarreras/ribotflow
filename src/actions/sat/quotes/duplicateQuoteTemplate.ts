/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/duplicateQuoteTemplate.ts
 * Description: Server Action to duplicate a quote template.
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteTemplateService } from "@/services/sat/quotes/quoteTemplateService";
import { revalidatePath } from "next/cache";

export async function duplicateQuoteTemplateAction(templateId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const template = await quoteTemplateService.duplicate(
      session.user.companyId,
      session.user.id,
      templateId
    );

    revalidatePath("/sat/quotes/templates");

    return { success: true, data: template };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to duplicate template" };
  }
}
