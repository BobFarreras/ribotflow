/**
 * Creation/modification date: 06/06/2026
 * Path: tests/components/sat/field/FieldStatusActions.test.tsx
 * Description: Smoke tests for the FieldStatusActions. Mocks the
 *              underlying Server Action so we exercise the button
 *              affordance per status.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldStatusActions } from "@/components/sat/field/FieldStatusActions";
import type { WorkOrderStatus } from "@/types/sat";

const { updateMyWorkOrderStatusActionMock, refreshMock } = vi.hoisted(() => ({
  updateMyWorkOrderStatusActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "in_progress": "Començar",
      "paused": "Pausar",
      "completed": "Finalitzar",
      "closed": "Tancada",
      "success": "Desat",
      "errors.generic": "Error",
      "errors.notAssigned": "No assignada",
      "errors.notFound": "No trobada",
    };
    return map[key] ?? key;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/actions/sat/field/updateMyWorkOrderStatus", () => ({
  updateMyWorkOrderStatusAction: updateMyWorkOrderStatusActionMock,
}));

beforeEach(() => {
  updateMyWorkOrderStatusActionMock.mockReset();
  refreshMock.mockReset();
});

const UUID = "11111111-1111-1111-1111-111111111111";

describe("FieldStatusActions", () => {
  it("shows a 'Començar' button when the order is scheduled", () => {
    render(<FieldStatusActions workOrderId={UUID} status="scheduled" />);
    expect(screen.getByRole("button", { name: "Començar" })).toBeInTheDocument();
  });

  it("shows 'Pausar' and 'Finalitzar' when the order is in progress", () => {
    render(<FieldStatusActions workOrderId={UUID} status="in_progress" />);
    expect(screen.getByRole("button", { name: "Pausar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Finalitzar" })).toBeInTheDocument();
  });

  it("shows the 'closed' hint when the order is completed", () => {
    render(<FieldStatusActions workOrderId={UUID} status="completed" />);
    expect(screen.getByText("Tancada")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls the action and refreshes on success", async () => {
    updateMyWorkOrderStatusActionMock.mockResolvedValueOnce({ success: true, data: {} });
    const user = userEvent.setup();
    render(<FieldStatusActions workOrderId={UUID} status="scheduled" />);
    await user.click(screen.getByRole("button", { name: "Començar" }));
    expect(updateMyWorkOrderStatusActionMock).toHaveBeenCalledWith({
      workOrderId: UUID,
      status: "in_progress" satisfies WorkOrderStatus,
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows a user-friendly error when the order is not assigned", async () => {
    updateMyWorkOrderStatusActionMock.mockResolvedValueOnce({
      success: false,
      error: "NOT_ASSIGNED",
    });
    const user = userEvent.setup();
    render(<FieldStatusActions workOrderId={UUID} status="scheduled" />);
    await user.click(screen.getByRole("button", { name: "Començar" }));
    expect(await screen.findByText("No assignada")).toBeInTheDocument();
  });
});
