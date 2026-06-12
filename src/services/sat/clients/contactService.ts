/**
 * Creation/modification date: 11/06/2026
 * Path: src/services/sat/clients/contactService.ts
 * Description: Client contacts CRUD service. Scoped by clientId + companyId for security.
 */

import { db } from "@/db";
import { clientContacts, clients } from "@/db/schema/sat";
import { eq, and, desc } from "drizzle-orm";

export interface CreateContactInput {
  name: string;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  isPrimary?: boolean;
  notes?: string | null;
}

export type UpdateContactInput = Partial<CreateContactInput>;

async function verifyClientOwnership(companyId: string, clientId: string) {
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.companyId, companyId)))
    .limit(1);

  if (!client) {
    throw new Error("Client not found or access denied");
  }
}

export const contactService = {
  async getByClient(companyId: string, clientId: string) {
    await verifyClientOwnership(companyId, clientId);

    return db
      .select()
      .from(clientContacts)
      .where(eq(clientContacts.clientId, clientId))
      .orderBy(desc(clientContacts.isPrimary), desc(clientContacts.createdAt));
  },

  async getById(companyId: string, contactId: string) {
    const [contact] = await db
      .select()
      .from(clientContacts)
      .innerJoin(clients, eq(clientContacts.clientId, clients.id))
      .where(and(eq(clientContacts.id, contactId), eq(clients.companyId, companyId)))
      .limit(1);

    return contact?.client_contacts ?? null;
  },

  async create(companyId: string, clientId: string, input: CreateContactInput) {
    await verifyClientOwnership(companyId, clientId);

    if (input.isPrimary) {
      await db
        .update(clientContacts)
        .set({ isPrimary: false })
        .where(eq(clientContacts.clientId, clientId));
    }

    const [contact] = await db
      .insert(clientContacts)
      .values({
        clientId,
        name: input.name,
        position: input.position ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        isPrimary: input.isPrimary ?? false,
        notes: input.notes ?? null,
      })
      .returning();

    return contact;
  },

  async update(companyId: string, contactId: string, input: UpdateContactInput) {
    const existing = await this.getById(companyId, contactId);
    if (!existing) {
      throw new Error("Contact not found or access denied");
    }

    if (input.isPrimary) {
      await db
        .update(clientContacts)
        .set({ isPrimary: false })
        .where(eq(clientContacts.clientId, existing.clientId));
    }

    const [updated] = await db
      .update(clientContacts)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.position !== undefined && { position: input.position }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.isPrimary !== undefined && { isPrimary: input.isPrimary }),
        ...(input.notes !== undefined && { notes: input.notes }),
        updatedAt: new Date(),
      })
      .where(eq(clientContacts.id, contactId))
      .returning();

    return updated;
  },

  async delete(companyId: string, contactId: string) {
    const existing = await this.getById(companyId, contactId);
    if (!existing) {
      throw new Error("Contact not found or access denied");
    }

    await db.delete(clientContacts).where(eq(clientContacts.id, contactId));
  },
};
