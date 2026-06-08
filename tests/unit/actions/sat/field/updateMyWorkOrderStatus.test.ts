/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/actions/sat/field/updateMyWorkOrderStatus.test.ts
 * Description: Server Action tests for the field mobile action.
 *              Mocks auth() and the work-order service to verify
 *              auth + ownership checks before mutating state.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, workOrderServiceMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  workOrderServiceMock: {
    getById: vi.fn(),
    updateStatus: vi.fn(),
  },
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/services/sat/work-orders/workOrderService", () => ({
  workOrderService: workOrderServiceMock,
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { updateMyWorkOrderStatusAction } from "@/actions/sat/field/updateMyWorkOrderStatus";

function session() {
  return {
    user: {
      id: "tech-1",
      companyId: "c-1",
      role: "TECHNICIAN",
      email: "t@x.com",
      name: "Tech",
    },
  };
}

const UUID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  authMock.mockReset();
  workOrderServiceMock.getById.mockReset();
  workOrderServiceMock.updateStatus.mockReset();
  revalidatePathMock.mockReset();
});

describe("updateMyWorkOrderStatusAction", () => {
  it("rejects when not signed in", async () => {
    authMock.mockResolvedValue(null);
    const r = await updateMyWorkOrderStatusAction({ workOrderId: UUID, status: "in_progress" });
    expect(r.success).toBe(false);
  });

  it("rejects malformed input", async () => {
    authMock.mockResolvedValue(session());
    const r = await updateMyWorkOrderStatusAction({ workOrderId: "not-a-uuid", status: "in_progress" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown status", async () => {
    authMock.mockResolvedValue(session());
    const r = await updateMyWorkOrderStatusAction({ workOrderId: UUID, status: "FROBNICATE" });
    expect(r.success).toBe(false);
  });

  it("returns NOT_FOUND when the order does not exist", async () => {
    authMock.mockResolvedValue(session());
    workOrderServiceMock.getById.mockResolvedValue(null);
    const r = await updateMyWorkOrderStatusAction({ workOrderId: UUID, status: "in_progress" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBe("NOT_FOUND");
    expect(workOrderServiceMock.updateStatus).not.toHaveBeenCalled();
  });

  it("returns NOT_ASSIGNED when the order is assigned to a different technician", async () => {
    authMock.mockResolvedValue(session());
    workOrderServiceMock.getById.mockResolvedValue({
      id: UUID,
      assignedTo: "other-tech",
    });
    const r = await updateMyWorkOrderStatusAction({ workOrderId: UUID, status: "in_progress" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error).toBe("NOT_ASSIGNED");
    expect(workOrderServiceMock.updateStatus).not.toHaveBeenCalled();
  });

  it("updates the status and revalidates the field list on success", async () => {
    authMock.mockResolvedValue(session());
    workOrderServiceMock.getById.mockResolvedValue({
      id: UUID,
      assignedTo: "tech-1",
    });
    workOrderServiceMock.updateStatus.mockResolvedValue({ id: UUID, status: "in_progress" });
    const r = await updateMyWorkOrderStatusAction({ workOrderId: UUID, status: "in_progress" });
    expect(r.success).toBe(true);
    expect(workOrderServiceMock.updateStatus).toHaveBeenCalledWith(
      "c-1",
      UUID,
      "tech-1",
      "in_progress",
      undefined
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/sat/field");
    expect(revalidatePathMock).toHaveBeenCalledWith(`/sat/${UUID}`);
  });
});
