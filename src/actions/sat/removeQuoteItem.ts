/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/removeQuoteItem.ts
 * Description: Server Action to remove a line item from a quote.
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteItemService } from "@/services/sat/quoteItemService";
import { revalidatePath } from "next/cache";

export async function removeQuoteItemAction(itemId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await quoteItemService.remove(session.user.companyId, itemId);

    // We need to revalidate the quote page, but we don't have the quoteId here
    // The revalidation will happen via the parent component refresh
    revalidatePath("/sat/quotes");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to remove quote item" };
  }
}
