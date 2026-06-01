/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/addQuoteItem.ts
 * Description: Server Action to add a line item to a quote.
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteItemService } from "@/services/sat/quoteItemService";
import { addQuoteItemSchema } from "@/lib/validators/sat/quoteSchema";
import { revalidatePath } from "next/cache";

export async function addQuoteItemAction(quoteId: string, input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = addQuoteItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const item = await quoteItemService.add(
      session.user.companyId,
      quoteId,
      parsed.data
    );

    revalidatePath(`/sat/quotes/${quoteId}`);

    return { success: true, data: item };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to add quote item" };
  }
}
