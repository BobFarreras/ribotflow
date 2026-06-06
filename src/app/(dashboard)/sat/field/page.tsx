/**
 * Creation/modification date: 06/06/2026
 * Path: src/app/(dashboard)/sat/field/page.tsx
 * Description: Mobile-first list of the signed-in technician's assigned
 *              work orders. Pure read + one-tap status change.
 *              TECHNICIAN-only by design (gated upstream by the
 *              `workorder:read:own` permission + the proxy's canSeePath).
 */

import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Smartphone } from "lucide-react";
import { workOrderService } from "@/services/sat/work-orders/workOrderService";
import { FieldWorkOrderCard } from "@/components/sat/field/FieldWorkOrderCard";
import { Inbox } from "lucide-react";

export const metadata = {
  title: "Camp · RIBOTFLOW",
};

export default async function FieldPage() {
  const session = await auth();
  if (!session?.user?.companyId || !session?.user?.id) {
    redirect("/login");
  }
  const companyId = session.user.companyId;
  const userId = session.user.id;

  const t = await getTranslations("sat.field");

  const rows = await workOrderService.getByCompanyWithRelations(companyId, {
    assignedTo: userId,
  });

  // Sort: in_progress first, then scheduled/assigned, then waiting_*,
  // then everything else, then completed/closed at the bottom.
  const priority: Record<string, number> = {
    in_progress: 0,
    scheduled: 1,
    assigned: 2,
    waiting_parts: 3,
    waiting_client: 4,
    paused: 5,
    pending: 6,
    cancelled: 7,
    completed: 8,
    closed: 9,
  };
  const sorted = [...rows].sort(
    (a, b) =>
      (priority[a.workOrder.status] ?? 99) - (priority[b.workOrder.status] ?? 99) ||
      a.workOrder.number.localeCompare(b.workOrder.number)
  );

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
          <Smartphone className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-[color:var(--text)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[color:var(--text-muted)]">
            {t("subtitle", { count: sorted.length })}
          </p>
        </div>
      </header>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--primary)]/10 text-[color:var(--primary)]">
            <Inbox className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-sm font-medium text-[color:var(--text)]">{t("empty.title")}</p>
          <p className="text-xs text-[color:var(--text-muted)]">{t("empty.body")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map(({ workOrder, client, category }) => (
            <li key={workOrder.id}>
              <FieldWorkOrderCard workOrder={workOrder} client={client} category={category} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
