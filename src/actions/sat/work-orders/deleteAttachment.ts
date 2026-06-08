/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/deleteAttachment.ts
 * Description: Server Action to delete an attachment and its binary file.
 *              Delegates storage removal to the attachment service.
 */

"use server";

import { auth } from "@/lib/auth";
import { attachmentService } from "@/services/sat/work-orders/attachmentService";
import { revalidatePath } from "next/cache";

export async function deleteAttachmentAction(attachmentId: string, workOrderId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await attachmentService.remove(session.user.companyId, attachmentId);

    revalidatePath(`/sat/${workOrderId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete attachment" };
  }
}
