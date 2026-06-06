/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/updateQuoteItem.ts
 * Description: Server Action to update a quote line item.
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteItemService } from "@/services/sat/quotes/quoteItemService";
import { updateQuoteItemSchema } from "@/lib/validators/sat/quoteSchema";
import { revalidatePath } from "next/cache";

export async function updateQuoteItemAction(itemId: string, input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = updateQuoteItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const item = await quoteItemService.update(session.user.companyId, itemId, parsed.data);

    revalidatePath(`/sat/quotes/${item.quoteId}`);

    return { success: true, data: item };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update quote item" };
  }
}
