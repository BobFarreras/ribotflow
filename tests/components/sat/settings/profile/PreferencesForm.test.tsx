/**
 * Creation/modification date: 06/06/2026
 * Path: tests/components/sat/settings/profile/PreferencesForm.test.tsx
 * Description: Smoke tests for the PreferencesForm. Mocks the underlying
 *              updatePreferencesAction so we exercise the UI states
 *              (pending, success, error) without touching the server.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PreferencesForm } from "@/components/sat/settings/profile/PreferencesForm";

const { updatePreferencesActionMock, refreshMock } = vi.hoisted(() => ({
  updatePreferencesActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      "saving": "Desant…",
      "saved": "Desat",
      "theme.label": "Tema",
      "theme.help": "Ajuda tema",
      "theme.light": "Clar",
      "theme.dark": "Fosc",
      "language.label": "Idioma",
      "language.help": "Ajuda idioma",
      "errors.generic": "Error genèric",
    };
    return map[key] ?? key;
  },
  useLocale: () => "ca",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/actions/sat/profile/updatePreferences", () => ({
  updatePreferencesAction: updatePreferencesActionMock,
}));

beforeEach(() => {
  updatePreferencesActionMock.mockReset();
  refreshMock.mockReset();
});

describe("PreferencesForm", () => {
  it("marks the active theme and locale as checked", () => {
    render(<PreferencesForm initialTheme="light" />);
    const themeRadios = screen.getAllByRole("radio", { name: /Clar|Fosc/ });
    expect(themeRadios[0]).toHaveAttribute("aria-checked", "true");
    expect(themeRadios[1]).toHaveAttribute("aria-checked", "false");

    const langRadios = screen.getAllByRole("radio", { name: /Català|Castellano/ });
    expect(langRadios[0]).toHaveAttribute("aria-checked", "true");
  });

  it("switches the active theme when the user clicks Dark", async () => {
    updatePreferencesActionMock.mockResolvedValue({ success: true, data: {} });
    const user = userEvent.setup();
    render(<PreferencesForm initialTheme="light" />);
    await user.click(screen.getByRole("radio", { name: /Fosc/ }));
    expect(updatePreferencesActionMock).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("triggers router.refresh on a successful language change", async () => {
    updatePreferencesActionMock.mockResolvedValue({ success: true, data: {} });
    const user = userEvent.setup();
    render(<PreferencesForm initialTheme="light" />);
    await user.click(screen.getByRole("radio", { name: /Castellano/ }));
    expect(updatePreferencesActionMock).toHaveBeenCalledWith({ locale: "es" });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the server error message on failure", async () => {
    updatePreferencesActionMock.mockResolvedValue({
      success: false,
      error: "boom",
    });
    const user = userEvent.setup();
    render(<PreferencesForm initialTheme="light" />);
    await user.click(screen.getByRole("radio", { name: /Fosc/ }));
    expect(await screen.findByText("boom")).toBeInTheDocument();
  });

  it("falls back to the generic message when the server returns no error", async () => {
    updatePreferencesActionMock.mockResolvedValue({ success: false });
    const user = userEvent.setup();
    render(<PreferencesForm initialTheme="light" />);
    await user.click(screen.getByRole("radio", { name: /Fosc/ }));
    expect(await screen.findByText("Error genèric")).toBeInTheDocument();
  });
});
