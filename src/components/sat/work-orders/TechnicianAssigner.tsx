/**
 * Creation/modification date: 24/05/2026
 * Path: src/components/sat/TechnicianAssigner.tsx
 * Description: Client component to assign or unassign a technician.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { assignTechnicianAction } from "@/actions/sat/work-orders/assignTechnician";
import { UserX } from "lucide-react";

interface TechnicianOption {
  id: string;
  name: string;
  email: string | null;
}

interface Props {
  workOrderId: string;
  currentTechnicianId: string | null;
  technicians: TechnicianOption[];
}

export function TechnicianAssigner({ workOrderId, currentTechnicianId, technicians }: Props) {
  const t = useTranslations("sat.workOrder");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign(technicianId: string | null) {
    setIsLoading(true);
    setError(null);

    const result = await assignTechnicianAction(workOrderId, technicianId);

    setIsLoading(false);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Error");
    }
  }

  if (technicians.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No hi ha tÃ¨cnics disponibles</p>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <select
        value={currentTechnicianId ?? ""}
        onChange={(e) => handleAssign(e.target.value || null)}
        disabled={isLoading}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--module-sat)] focus:outline-none focus:ring-1 focus:ring-[var(--module-sat)] disabled:opacity-50"
      >
        <option value="">{t("detail.unassigned")}</option>
        {technicians.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.name}
          </option>
        ))}
      </select>

      {currentTechnicianId && (
        <button
          onClick={() => handleAssign(null)}
          disabled={isLoading}
          className="flex w-full items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          <UserX className="h-4 w-4" />
          <span>{t("detail.unassign")}</span>
        </button>
      )}
    </div>
  );
}
