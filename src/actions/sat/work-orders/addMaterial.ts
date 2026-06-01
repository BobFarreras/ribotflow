/**
 * Creation/modification date: 26/05/2026
 * Path: src/actions/sat/addMaterial.ts
 * Description: Server Action to add a material to a work order.
 */

"use server";

import { auth } from "@/lib/auth";
import { addMaterialSchema } from "@/lib/validators/sat/materialSchema";
import { materialService } from "@/services/sat/work-orders/materialService";
import { revalidatePath } from "next/cache";

export async function addMaterialAction(rawInput: unknown) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const input = addMaterialSchema.parse(rawInput);

    const material = await materialService.add(
      session.user.companyId,
      input
    );

    revalidatePath(`/sat/${input.workOrderId}`);

    return { success: true, data: material };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to add material" };
  }
}
