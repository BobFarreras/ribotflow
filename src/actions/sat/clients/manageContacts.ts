/**
 * Creation/modification date: 11/06/2026
 * Path: src/actions/sat/clients/manageContacts.ts
 * Description: Server Actions for managing client contacts (create, update, delete).
 */

"use server";

import { auth } from "@/lib/auth";
import { contactService } from "@/services/sat/clients/contactService";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "El nom és obligatori").max(200),
  position: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email("Email invàlid").optional().nullable(),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export async function createContactAction(clientId: string, input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const contact = await contactService.create(
      session.user.companyId,
      clientId,
      parsed.data
    );

    revalidatePath(`/sat/clients/${clientId}`);
    return { success: true, data: contact };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create contact" };
  }
}

export async function updateContactAction(contactId: string, input: unknown) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = contactSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid data" };
    }

    const contact = await contactService.update(
      session.user.companyId,
      contactId,
      parsed.data
    );

    revalidatePath(`/sat/clients`);
    return { success: true, data: contact };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update contact" };
  }
}

export async function deleteContactAction(contactId: string) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await contactService.delete(session.user.companyId, contactId);

    revalidatePath(`/sat/clients`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete contact" };
  }
}
