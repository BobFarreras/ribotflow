/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/work-orders/WorkOrderForm/useWorkOrderForm.ts
 * Description: State machine for the new-work-order form.
 *              Encapsulates fields, address logic, and client/address syncing.
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import type { WorkOrderFormResult, WorkOrderLocation } from "./types";
import type { CategoryOption, ClientOption } from "./types";
import type { WorkOrderPriority } from "@/types/sat";

interface UseWorkOrderFormOptions {
  clients: ClientOption[];
  categories: CategoryOption[];
}

export function useWorkOrderForm({
  clients,
  categories,
}: UseWorkOrderFormOptions): WorkOrderFormResult {
  const [clientId, setClientId] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WorkOrderPriority>("medium");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<WorkOrderLocation | null>(null);
  const [useClientAddress, setUseClientAddress] = useState(true);

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const handleClientChange = (id: string) => {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client && useClientAddress) {
      setAddress(client.address ?? "");
      setLocation(client.location);
    }
  };

  const setUseClientAddressAndSync = (checked: boolean) => {
    setUseClientAddress(checked);
    if (checked && selectedClient) {
      setAddress(selectedClient.address ?? "");
      setLocation(selectedClient.location);
    }
  };

  const handleAddressChange = useCallback(
    (newAddress: string, newLocation: WorkOrderLocation | null) => {
      setAddress(newAddress);
      setLocation(newLocation);
      if (!newLocation) setUseClientAddress(false);
    },
    []
  );

  return {
    state: {
      clientId,
      categoryId,
      title,
      description,
      priority,
      scheduledDate,
      estimatedDuration,
      notes,
      address,
      location,
      useClientAddress,
    },
    actions: {
      setClientId,
      setCategoryId,
      setTitle,
      setDescription,
      setPriority,
      setScheduledDate,
      setEstimatedDuration,
      setNotes,
      setAddress,
      setLocation,
      setUseClientAddress: setUseClientAddressAndSync,
      handleClientChange,
      handleAddressChange,
    },
  };
}
