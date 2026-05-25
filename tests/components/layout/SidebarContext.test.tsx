/**
 * Creation/modification date: 25/05/2026
 * Path: tests/components/layout/SidebarContext.test.tsx
 * Description: Tests for SidebarContext provider and useSidebar hook.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SidebarProvider, useSidebar } from "@/components/layout/SidebarContext";

function TestComponent() {
  const { isCollapsed, isMobileOpen, theme, toggleCollapse, toggleMobile, toggleTheme } = useSidebar();
  return (
    <div>
      <span data-testid="collapsed">{isCollapsed ? "true" : "false"}</span>
      <span data-testid="mobile">{isMobileOpen ? "true" : "false"}</span>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleCollapse}>Toggle Collapse</button>
      <button onClick={toggleMobile}>Toggle Mobile</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

describe("SidebarContext", () => {
  it("provides default state", () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId("collapsed")).toHaveTextContent("false");
    expect(screen.getByTestId("mobile")).toHaveTextContent("false");
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("toggles collapsed state", () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    act(() => {
      screen.getByRole("button", { name: /Toggle Collapse/i }).click();
    });

    expect(screen.getByTestId("collapsed")).toHaveTextContent("true");

    act(() => {
      screen.getByRole("button", { name: /Toggle Collapse/i }).click();
    });

    expect(screen.getByTestId("collapsed")).toHaveTextContent("false");
  });

  it("toggles mobile state", () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    act(() => {
      screen.getByRole("button", { name: /Toggle Mobile/i }).click();
    });

    expect(screen.getByTestId("mobile")).toHaveTextContent("true");
  });

  it("toggles theme between light and dark", () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("light");

    act(() => {
      screen.getByRole("button", { name: /Toggle Theme/i }).click();
    });

    expect(screen.getByTestId("theme")).toHaveTextContent("dark");

    act(() => {
      screen.getByRole("button", { name: /Toggle Theme/i }).click();
    });

    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("throws error when useSidebar is used outside provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow("useSidebar must be used within SidebarProvider");

    consoleError.mockRestore();
  });
});
