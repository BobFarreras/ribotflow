/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/deleteAttachment.ts
 * Description: Server Action to delete an attachment and its file.
 */

"use server";

import { auth } from "@/lib/auth";
import { attachmentService } from "@/services/sat/attachmentService";
import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import { join } from "path";

export async function deleteAttachmentAction(attachmentId: string, workOrderId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await attachmentService.remove(session.user.companyId, attachmentId);

    // Delete file from disk
    if (result.storageKey) {
      try {
        await unlink(join(process.cwd(), "uploads", result.storageKey));
      } catch {
        // Ignore if file already deleted or not found
      }
    }

    revalidatePath(`/sat/${workOrderId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete attachment" };
  }
}
