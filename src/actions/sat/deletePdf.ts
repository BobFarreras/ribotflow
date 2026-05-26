/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/deletePdf.ts
 * Description: Server Action to delete a work order PDF from storage
 *              and clear the pdfUrl in the database.
 */

"use server";

import { auth } from "@/lib/auth";
import { pdfService } from "@/services/sat/pdfService";
import { revalidatePath } from "next/cache";

export async function deletePdfAction(workOrderId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await pdfService.deletePdf(session.user.companyId, workOrderId);

    revalidatePath(`/sat/${workOrderId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete PDF" };
  }
}
