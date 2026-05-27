/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: src/services/sat/workOrderService.ts
 * Descripció: Lògica de negoci del Mòdul SAT (CRUD + workflow d'ordres).
 */

import { db } from "@/db";
import { workOrders, workOrderStatusHistory, workOrderCategories, clients } from "@/db/schema/sat";
import { users } from "@/db/schema/auth";
import { eq, and, desc, sql } from "drizzle-orm";
import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
} from "@/lib/validators/sat/workOrderSchema";
import type { WorkOrderStatus } from "@/types/sat";
import { isValidTransition } from "@/lib/constants/statusTransitions";

export const workOrderService = {
  async getNextOrderNumber(companyId: string) {
    const year = new Date().getFullYear();
    const prefix = `OT-${year}-`;

    const result = await db
      .select({ maxNumber: sql<string>`MAX(${workOrders.number})` })
      .from(workOrders)
      .where(
        and(eq(workOrders.companyId, companyId), sql`${workOrders.number} LIKE ${prefix + "%"}`)
      );

    const maxNumber = result[0]?.maxNumber;
    let sequence = 1;

    if (maxNumber) {
      const match = maxNumber.match(/-(\d+)$/);
      if (match) {
        sequence = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(4, "0")}`;
  },

  async getDefaultCategoryId(companyId: string) {
    const result = await db
      .select({ id: workOrderCategories.id })
      .from(workOrderCategories)
      .where(
        and(eq(workOrderCategories.companyId, companyId), eq(workOrderCategories.isDefault, true))
      )
      .limit(1);

    if (result.length === 0) {
      throw new Error("No default work order category found for company");
    }

    return result[0].id;
  },

  async create(companyId: string, userId: string, input: CreateWorkOrderInput) {
    const number = await this.getNextOrderNumber(companyId);

    const [workOrder] = await db
      .insert(workOrders)
      .values({
        companyId,
        clientId: input.clientId,
        categoryId: input.categoryId,
        createdBy: userId,
        number,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority,
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
        estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
        notes: input.notes ?? null,
        address: input.address ?? null,
        location: input.location ?? null,
        status: "pending",
      })
      .returning();

    await db.insert(workOrderStatusHistory).values({
      workOrderId: workOrder.id,
      statusFrom: null,
      statusTo: "pending",
      changedBy: userId,
      reason: "Work order created",
    });

    return workOrder;
  },

  async update(companyId: string, workOrderId: string, input: UpdateWorkOrderInput) {
    const existing = await db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Work order not found");
    }

    const [updated] = await db
      .update(workOrders)
      .set({
        ...input,
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId))
      .returning();

    return updated;
  },

  async updateStatus(
    companyId: string,
    workOrderId: string,
    userId: string,
    newStatus: WorkOrderStatus,
    reason?: string
  ) {
    const existing = await db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Work order not found");
    }

    const currentStatus = existing[0].status as WorkOrderStatus;

    if (!isValidTransition(currentStatus, newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    const updateData: Partial<typeof workOrders.$inferInsert> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "in_progress" && !existing[0].startedAt) {
      updateData.startedAt = new Date();
    }

    if (newStatus === "completed") {
      updateData.completedAt = new Date();
      if (existing[0].startedAt) {
        const duration = (new Date().getTime() - existing[0].startedAt.getTime()) / 60000;
        updateData.actualDurationMinutes = Math.round(duration);
      }
    }

    if (newStatus === "closed") {
      updateData.closedAt = new Date();
    }

    const [updated] = await db
      .update(workOrders)
      .set(updateData)
      .where(eq(workOrders.id, workOrderId))
      .returning();

    await db.insert(workOrderStatusHistory).values({
      workOrderId,
      statusFrom: currentStatus,
      statusTo: newStatus,
      changedBy: userId,
      reason: reason ?? null,
    });

    return updated;
  },

  async getById(companyId: string, workOrderId: string) {
    const result = await db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    return result[0] ?? null;
  },

  async getByIdWithRelations(companyId: string, workOrderId: string) {
    const result = await db
      .select({
        workOrder: workOrders,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          phone: clients.phone,
          address: clients.address,
          location: clients.location,
        },
        category: {
          id: workOrderCategories.id,
          name: workOrderCategories.name,
          slug: workOrderCategories.slug,
          color: workOrderCategories.color,
        },
        technician: {
          id: users.id,
          name: users.name,
        },
      })
      .from(workOrders)
      .innerJoin(clients, eq(workOrders.clientId, clients.id))
      .innerJoin(workOrderCategories, eq(workOrders.categoryId, workOrderCategories.id))
      .leftJoin(users, eq(workOrders.assignedTo, users.id))
      .where(and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    return result[0] ?? null;
  },

  async getByCompany(
    companyId: string,
    filters?: { status?: WorkOrderStatus; assignedTo?: string }
  ) {
    const conditions = [eq(workOrders.companyId, companyId)];

    if (filters?.status) {
      conditions.push(eq(workOrders.status, filters.status));
    }

    if (filters?.assignedTo) {
      conditions.push(eq(workOrders.assignedTo, filters.assignedTo));
    }

    return db
      .select()
      .from(workOrders)
      .where(and(...conditions))
      .orderBy(desc(workOrders.createdAt));
  },

  async getByCompanyWithRelations(
    companyId: string,
    filters?: { status?: WorkOrderStatus; assignedTo?: string }
  ) {
    const conditions = [eq(workOrders.companyId, companyId)];

    if (filters?.status) {
      conditions.push(eq(workOrders.status, filters.status));
    }

    if (filters?.assignedTo) {
      conditions.push(eq(workOrders.assignedTo, filters.assignedTo));
    }

    return db
      .select({
        workOrder: workOrders,
        client: { id: clients.id, name: clients.name, phone: clients.phone, address: clients.address },
        category: {
          id: workOrderCategories.id,
          name: workOrderCategories.name,
          slug: workOrderCategories.slug,
          color: workOrderCategories.color,
        },
        technician: { id: users.id, name: users.name },
      })
      .from(workOrders)
      .innerJoin(clients, eq(workOrders.clientId, clients.id))
      .innerJoin(workOrderCategories, eq(workOrders.categoryId, workOrderCategories.id))
      .leftJoin(users, eq(workOrders.assignedTo, users.id))
      .where(and(...conditions))
      .orderBy(desc(workOrders.createdAt));
  },

  async assignTechnician(companyId: string, workOrderId: string, technicianId: string | null) {
    const existing = await db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Work order not found");
    }

    if (technicianId) {
      const tech = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, technicianId),
            eq(users.companyId, companyId),
            eq(users.role, "TECHNICIAN")
          )
        )
        .limit(1);

      if (tech.length === 0) {
        throw new Error("Technician not found in company");
      }
    }

    const [updated] = await db
      .update(workOrders)
      .set({ assignedTo: technicianId, updatedAt: new Date() })
      .where(eq(workOrders.id, workOrderId))
      .returning();

    return updated;
  },

  async getTechniciansByCompany(companyId: string) {
    return db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.companyId, companyId), eq(users.role, "TECHNICIAN")))
      .orderBy(users.name);
  },

  async getStatusHistory(workOrderId: string) {
    return db
      .select()
      .from(workOrderStatusHistory)
      .where(eq(workOrderStatusHistory.workOrderId, workOrderId))
      .orderBy(desc(workOrderStatusHistory.createdAt));
  },

  async updateTravelMetrics(
    companyId: string,
    workOrderId: string,
    distanceKm: number,
    durationMinutes: number
  ) {
    const [updated] = await db
      .update(workOrders)
      .set({
        travelDistanceKm: String(distanceKm),
        travelDurationMinutes: durationMinutes,
        updatedAt: new Date(),
      })
      .where(and(eq(workOrders.id, workOrderId), eq(workOrders.companyId, companyId)))
      .returning();

    return updated;
  },
};
