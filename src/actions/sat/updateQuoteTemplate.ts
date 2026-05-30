/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/updateQuoteTemplate.ts
 * Description: Server Action to update a quote template.
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteTemplateService } from "@/services/sat/quoteTemplateService";
import { updateTemplateSchema } from "@/lib/validators/sat/quoteSchema";
import { revalidatePath } from "next/cache";

export async function updateQuoteTemplateAction(templateId: string, input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = updateTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const template = await quoteTemplateService.update(
      session.user.companyId,
      templateId,
      parsed.data
    );

    revalidatePath("/sat/quotes/templates");
    revalidatePath(`/sat/quotes/templates/${templateId}`);

    return { success: true, data: template };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update template" };
  }
}
