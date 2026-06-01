/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/updateQuoteStatus.ts
 * Description: Server Action to change quote status with validation.
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteService } from "@/services/sat/quoteService";
import { quoteStatusSchema } from "@/lib/validators/sat/quoteSchema";
import { revalidatePath } from "next/cache";

export async function updateQuoteStatusAction(quoteId: string, input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = quoteStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const quote = await quoteService.updateStatus(
      session.user.companyId,
      quoteId,
      session.user.id,
      parsed.data
    );

    revalidatePath("/sat/quotes");
    revalidatePath(`/sat/quotes/${quoteId}`);
    revalidatePath(`/sat/${quote.workOrderId}`);

    return { success: true, data: quote };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update quote status" };
  }
}
