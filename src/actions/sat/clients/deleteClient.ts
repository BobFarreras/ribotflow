/**
 * Creation/modification date: 11/06/2026
 * Path: src/actions/sat/clients/deleteClient.ts
 * Description: Server Action to delete a SAT client. Enforces company_id.
 */

"use server";

import { auth } from "@/lib/auth";
import { clientService } from "@/services/sat/clients/clientService";
import { revalidatePath } from "next/cache";

export async function deleteClientAction(clientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await clientService.delete(session.user.companyId, clientId);

    revalidatePath("/sat/clients");
    revalidatePath("/sat");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete client" };
  }
}
