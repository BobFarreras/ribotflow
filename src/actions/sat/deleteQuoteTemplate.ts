/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/deleteQuoteTemplate.ts
 * Description: Server Action to delete a quote template.
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteTemplateService } from "@/services/sat/quoteTemplateService";
import { revalidatePath } from "next/cache";

export async function deleteQuoteTemplateAction(templateId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await quoteTemplateService.delete(session.user.companyId, templateId);

    revalidatePath("/sat/quotes/templates");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete template" };
  }
}
