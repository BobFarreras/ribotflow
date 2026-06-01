/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderForm/types.ts
 * Description: Shared types for the WorkOrderForm component and its sub-components.
 */

import type { WorkOrderPriority } from "@/types/sat";

export interface ClientOption {
  id: string;
  name: string;
  address: string | null;
  location: { lat: number; lng: number } | null;
}

export interface CategoryOption {
  id: string;
  name: string;
  color: string | null;
}

export interface WorkOrderLocation {
  lat: number;
  lng: number;
}

export interface WorkOrderFormState {
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  scheduledDate: string;
  estimatedDuration: string;
  notes: string;
  address: string;
  location: WorkOrderLocation | null;
  useClientAddress: boolean;
}

export interface WorkOrderFormActions {
  setClientId: (id: string) => void;
  setCategoryId: (id: string) => void;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setPriority: (v: WorkOrderPriority) => void;
  setScheduledDate: (v: string) => void;
  setEstimatedDuration: (v: string) => void;
  setNotes: (v: string) => void;
  setAddress: (v: string) => void;
  setLocation: (loc: WorkOrderLocation | null) => void;
  setUseClientAddress: (v: boolean) => void;
  handleClientChange: (id: string) => void;
  handleAddressChange: (address: string, location: WorkOrderLocation | null) => void;
}

export interface WorkOrderFormResult {
  state: WorkOrderFormState;
  actions: WorkOrderFormActions;
}
