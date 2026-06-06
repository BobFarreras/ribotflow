/**
 * Creation/modification date: 06/06/2026
 * Path: tests/components/sat/settings/profile/ActiveSessionsList.test.tsx
 * Description: Smoke tests for the ActiveSessionsList. Mocks the
 *              underlying Server Actions so we exercise the empty
 *              state, the "current" badge, and the per-row revoke
 *              interaction.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveSessionsList } from "@/components/sat/settings/profile/ActiveSessionsList";

const { revokeSessionActionMock, revokeAllOtherSessionsActionMock, refreshMock } = vi.hoisted(() => ({
  revokeSessionActionMock: vi.fn(),
  revokeAllOtherSessionsActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      "empty": "Cap sessió activa",
      "current": "Aquest dispositiu",
      "revoke": "Tanca",
      "revokeAllOthers": "Tanca totes les altres",
      "feedback.revoked": "Tancada",
      "feedback.revokedMany": `Tancades ${vars?.count ?? 0}`,
      "feedback.revokedNone": "Cap",
      "errors.generic": "Error",
      "errors.cannotRevokeCurrent": "No pots tancar l'actual",
    };
    if (key === "lastActivity") return `Última: ${(vars as { when: string })?.when}`;
    return map[key] ?? key;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/actions/sat/profile/revokeSession", () => ({
  revokeSessionAction: revokeSessionActionMock,
}));
vi.mock("@/actions/sat/profile/revokeAllOtherSessions", () => ({
  revokeAllOtherSessionsAction: revokeAllOtherSessionsActionMock,
}));

beforeEach(() => {
  revokeSessionActionMock.mockReset();
  revokeAllOtherSessionsActionMock.mockReset();
  refreshMock.mockReset();
});

describe("ActiveSessionsList", () => {
  it("shows the empty state when there are no sessions", () => {
    render(<ActiveSessionsList sessions={[]} currentSessionId={null} />);
    expect(screen.getByText("Cap sessió activa")).toBeInTheDocument();
  });

  it("marks the current session with a badge and hides its revoke button", () => {
    const sessions = [
      {
        id: "s-current",
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expires: new Date(),
        userAgent: "Chrome on macOS",
        ipAddress: "127.0.0.1",
      },
    ];
    render(<ActiveSessionsList sessions={sessions} currentSessionId="s-current" />);
    expect(screen.getByText("Aquest dispositiu")).toBeInTheDocument();
    // No revoke button for the current session
    expect(screen.queryByRole("button", { name: "Tanca" })).not.toBeInTheDocument();
  });

  it("shows a per-row revoke button for non-current sessions", () => {
    const sessions = [
      {
        id: "s-other",
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expires: new Date(),
        userAgent: "Firefox on Windows",
        ipAddress: "10.0.0.1",
      },
    ];
    render(<ActiveSessionsList sessions={sessions} currentSessionId="s-current" />);
    const buttons = screen.getAllByRole("button", { name: "Tanca" });
    expect(buttons).toHaveLength(1);
  });

  it("calls the action and refreshes the router on revoke", async () => {
    revokeSessionActionMock.mockResolvedValue({ success: true });
    const sessions = [
      {
        id: "s-other",
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expires: new Date(),
        userAgent: "Firefox on Windows",
        ipAddress: "10.0.0.1",
      },
    ];
    const user = userEvent.setup();
    render(<ActiveSessionsList sessions={sessions} currentSessionId="s-current" />);
    await user.click(screen.getByRole("button", { name: "Tanca" }));
    expect(revokeSessionActionMock).toHaveBeenCalledWith({ sessionId: "s-other" });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the generic error message when the action fails", async () => {
    revokeSessionActionMock.mockResolvedValue({ success: false });
    const sessions = [
      {
        id: "s-other",
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expires: new Date(),
        userAgent: "Firefox on Windows",
        ipAddress: "10.0.0.1",
      },
    ];
    const user = userEvent.setup();
    render(<ActiveSessionsList sessions={sessions} currentSessionId="s-current" />);
    await user.click(screen.getByRole("button", { name: "Tanca" }));
    expect(await screen.findByText("Error")).toBeInTheDocument();
  });

  it("exposes a 'revoke all others' button when there is at least one other session", async () => {
    revokeAllOtherSessionsActionMock.mockResolvedValue({ success: true, data: { revoked: 2 } });
    const sessions = [
      {
        id: "s-current",
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expires: new Date(),
        userAgent: "Chrome on macOS",
        ipAddress: "127.0.0.1",
      },
      {
        id: "s-other",
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expires: new Date(),
        userAgent: "Firefox on Windows",
        ipAddress: "10.0.0.1",
      },
    ];
    const user = userEvent.setup();
    render(<ActiveSessionsList sessions={sessions} currentSessionId="s-current" />);
    await user.click(screen.getByRole("button", { name: "Tanca totes les altres" }));
    expect(revokeAllOtherSessionsActionMock).toHaveBeenCalled();
  });
});
