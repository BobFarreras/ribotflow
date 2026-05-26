/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/removeMaterial.ts
 * Description: Server Action to remove a material from a work order.
 */

"use server";

import { auth } from "@/lib/auth";
import { materialService } from "@/services/sat/materialService";
import { revalidatePath } from "next/cache";

export async function removeMaterialAction(materialId: string, workOrderId: string) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await materialService.remove(session.user.companyId, materialId);

    revalidatePath(`/sat/${workOrderId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to remove material" };
  }
}
