/**
 * Creation/modification date: 11/06/2026
 * Path: src/services/sat/clients/clientService.ts
 * Description: Client CRUD service with multi-tenant security (company_id filter).
 */

import { db } from "@/db";
import { clients } from "@/db/schema/sat";
import { eq, and, desc, or, ilike } from "drizzle-orm";

export interface CreateClientInput {
  companyId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  location?: { lat: number; lng: number } | null;
}

export type UpdateClientInput = Partial<Omit<CreateClientInput, "companyId">>;

export const clientService = {
  async getById(companyId: string, clientId: string) {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.companyId, companyId)))
      .limit(1);

    return client ?? null;
  },

  async getAll(companyId: string) {
    return db
      .select()
      .from(clients)
      .where(eq(clients.companyId, companyId))
      .orderBy(desc(clients.createdAt));
  },

  async search(companyId: string, query: string) {
    const pattern = `%${query}%`;
    return db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.companyId, companyId),
          or(
            ilike(clients.name, pattern),
            ilike(clients.email, pattern),
            ilike(clients.phone, pattern)
          )
        )
      )
      .orderBy(desc(clients.createdAt));
  },

  async create(input: CreateClientInput) {
    const [client] = await db
      .insert(clients)
      .values({
        companyId: input.companyId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        taxId: input.taxId ?? null,
        location: input.location ?? null,
      })
      .returning();

    return client;
  },

  async update(companyId: string, clientId: string, input: UpdateClientInput) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.companyId, companyId)))
      .limit(1);

    if (!client) {
      throw new Error("Client not found or access denied");
    }

    const [updated] = await db
      .update(clients)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.taxId !== undefined && { taxId: input.taxId }),
        ...(input.location !== undefined && { location: input.location }),
        updatedAt: new Date(),
      })
      .where(eq(clients.id, clientId))
      .returning();

    return updated;
  },

  async delete(companyId: string, clientId: string) {
    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.companyId, companyId)))
      .limit(1);

    if (!client) {
      throw new Error("Client not found or access denied");
    }

    await db.delete(clients).where(eq(clients.id, clientId));
  },
};
