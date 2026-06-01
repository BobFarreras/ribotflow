/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/updateQuote.ts
 * Description: Server Action to update an existing quote (draft only).
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteService } from "@/services/sat/quoteService";
import { updateQuoteSchema } from "@/lib/validators/sat/quoteSchema";
import { revalidatePath } from "next/cache";

export async function updateQuoteAction(quoteId: string, input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = updateQuoteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const quote = await quoteService.update(
      session.user.companyId,
      quoteId,
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
    return { success: false, error: "Failed to update quote" };
  }
}
