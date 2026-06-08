/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/createQuoteTemplate.ts
 * Description: Server Action to create a quote template.
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteTemplateService } from "@/services/sat/quotes/quoteTemplateService";
import { createTemplateSchema } from "@/lib/validators/sat/quoteSchema";
import { revalidatePath } from "next/cache";

export async function createQuoteTemplateAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = createTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const template = await quoteTemplateService.create(
      session.user.companyId,
      session.user.id,
      parsed.data
    );

    revalidatePath("/sat/quotes/templates");

    return { success: true, data: template };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create template" };
  }
}
