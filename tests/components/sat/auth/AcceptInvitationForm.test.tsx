/**
 * Creation/modification date: 06/06/2026
 * Path: tests/components/sat/auth/AcceptInvitationForm.test.tsx
 * Description: Smoke tests for the AcceptInvitationForm. Mocks
 *              signIn() and the Server Action so the form can be
 *              exercised without a network or real session.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcceptInvitationForm } from "@/components/sat/auth/AcceptInvitationForm";

const { acceptInvitationActionMock, signInMock, pushMock, refreshMock } = vi.hoisted(() => ({
  acceptInvitationActionMock: vi.fn(),
  signInMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "invitedAs": "Convida",
      "fields.password": "Contrasenya",
      "fields.confirm": "Repeteix",
      "fields.hint": "Mínim 8",
      "show": "Mostra",
      "hide": "Amaga",
      "submit": "Activar",
      "success.signInPending": "Sessió pendent",
      "errors.invalidToken": "Token invàlid",
      "errors.alreadyAccepted": "Ja acceptat",
      "errors.passwordTooShort": "Massa curta",
      "errors.generic": "Error genèric",
    };
    return map[key] ?? key;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

vi.mock("@/actions/sat/team/acceptInvitation", () => ({
  acceptInvitationAction: acceptInvitationActionMock,
}));

beforeEach(() => {
  acceptInvitationActionMock.mockReset();
  signInMock.mockReset();
  pushMock.mockReset();
  refreshMock.mockReset();
});

describe("AcceptInvitationForm", () => {
  it("renders the email and name of the invitee", () => {
    render(
      <AcceptInvitationForm
        token="abc-1234567890"
        invitedEmail="joan@acme.test"
        invitedName="Joan"
      />
    );
    expect(screen.getByText(/Convida/)).toBeInTheDocument();
  });

  it("submits, signs in and navigates to /dashboard on success", async () => {
    acceptInvitationActionMock.mockResolvedValueOnce({
      success: true,
      data: { email: "joan@acme.test", name: "Joan" },
    });
    signInMock.mockResolvedValueOnce({ ok: true });
    const user = userEvent.setup();
    render(
      <AcceptInvitationForm
        token="abc-1234567890"
        invitedEmail="joan@acme.test"
        invitedName="Joan"
      />
    );
    await user.type(screen.getByLabelText("Contrasenya"), "ValidP@ss1");
    await user.type(screen.getByLabelText("Repeteix"), "ValidP@ss1");
    await user.click(screen.getByRole("button", { name: "Activar" }));
    expect(acceptInvitationActionMock).toHaveBeenCalledWith({
      token: "abc-1234567890",
      password: "ValidP@ss1",
      confirmPassword: "ValidP@ss1",
    });
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "joan@acme.test",
      password: "ValidP@ss1",
      redirect: false,
    });
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("shows the user-facing error on failure", async () => {
    acceptInvitationActionMock.mockResolvedValueOnce({
      success: false,
      error: "INVALID_TOKEN",
    });
    const user = userEvent.setup();
    render(
      <AcceptInvitationForm
        token="abc-1234567890"
        invitedEmail="joan@acme.test"
        invitedName="Joan"
      />
    );
    await user.type(screen.getByLabelText("Contrasenya"), "ValidP@ss1");
    await user.type(screen.getByLabelText("Repeteix"), "ValidP@ss1");
    await user.click(screen.getByRole("button", { name: "Activar" }));
    expect(await screen.findByText("Token invàlid")).toBeInTheDocument();
  });
});
