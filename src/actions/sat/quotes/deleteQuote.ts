/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/deleteQuote.ts
 * Description: Server Action to delete a quote (draft only).
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteService } from "@/services/sat/quotes/quoteService";
import { revalidatePath } from "next/cache";

export async function deleteQuoteAction(quoteId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await quoteService.delete(session.user.companyId, quoteId);

    revalidatePath("/sat/quotes");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete quote" };
  }
}
