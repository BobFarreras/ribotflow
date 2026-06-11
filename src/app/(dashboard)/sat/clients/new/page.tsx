/**
 * Creation/modification date: 27/05/2026
 * Path: src/app/(dashboard)/sat/clients/new/page.tsx
 * Description: Create new SAT client page using shared ClientForm component.
 */

import { ClientForm } from "@/components/sat/clients/ClientForm";
import { createClientAction } from "@/actions/sat/clients/createClient";

export default function NewClientPage() {
  return (
    <ClientForm
      mode="create"
      onSubmit={async (data) => {
        "use server";
        return createClientAction({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          taxId: data.taxId || null,
          lat: data.lat ? parseFloat(data.lat) : null,
          lng: data.lng ? parseFloat(data.lng) : null,
        });
      }}
      cancelHref="/sat/clients"
    />
  );
}
