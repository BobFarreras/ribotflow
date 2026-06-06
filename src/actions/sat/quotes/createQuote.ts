/**
 * Creation/modification date: 28/05/2026
 * Path: src/actions/sat/createQuote.ts
 * Description: Server Action to create a new quote with line items.
 */

"use server";

import { auth } from "@/lib/auth";
import { quoteService } from "@/services/sat/quotes/quoteService";
import { createQuoteSchema } from "@/lib/validators/sat/quoteSchema";
import { revalidatePath } from "next/cache";

export async function createQuoteAction(input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = createQuoteSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const quote = await quoteService.create(session.user.companyId, session.user.id, parsed.data);

    revalidatePath("/sat/quotes");
    revalidatePath(`/sat/${parsed.data.workOrderId}`);
    revalidatePath(`/sat/quotes/${quote.id}`);

    return { success: true, data: quote };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create quote" };
  }
}
