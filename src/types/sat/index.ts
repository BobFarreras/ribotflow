/**
 * Data de creació/modificació: 24/05/2026
 * Ruta: src/types/sat/index.ts
 * Descripció: Tipus TypeScript del Mòdul SAT.
 */

export type WorkOrderStatus =
  | "pending"
  | "assigned"
  | "scheduled"
  | "in_progress"
  | "paused"
  | "completed"
  | "closed"
  | "cancelled"
  | "waiting_parts"
  | "waiting_client";

export type WorkOrderPriority = "low" | "medium" | "high" | "urgent";

export type AttachmentType = "photo" | "video" | "document" | "audio";

export type LocationEventType = "check_in" | "check_out" | "location_update" | "route_point";

export interface Client {
  id: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  location: { lat: number; lng: number } | null;
  taxId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderCategory {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  id: string;
  companyId: string;
  clientId: string;
  categoryId: string;
  assignedTo: string | null;
  createdBy: string;
  number: string;
  title: string;
  description: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  closedAt: Date | null;
  estimatedDurationMinutes: number | null;
  actualDurationMinutes: number | null;
  notes: string | null;
  signatureUrl: string | null;
  signatureAt: Date | null;
  pdfUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrderMaterial {
  id: string;
  workOrderId: string;
  productId: string | null;
  name: string;
  quantity: string;
  unitPrice: string | null;
  unitCost: string | null;
  createdAt: Date;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string | null;
  unitPrice: string | null;
  unitCost: string | null;
  stock: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
