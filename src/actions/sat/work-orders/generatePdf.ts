/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/generatePdf.ts
 * Description: Server Action to generate and store a work order PDF.
 */

"use server";

import { auth } from "@/lib/auth";
import { pdfService } from "@/services/pdf";
import { revalidatePath } from "next/cache";

export async function generatePdfAction(workOrderId: string, lang: "ca" | "es" | "en" = "ca") {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await pdfService.generateWorkOrderPdf(session.user.companyId, workOrderId, lang);

    revalidatePath(`/sat/${workOrderId}`);

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to generate PDF" };
  }
}
