/**
 * Creation/modification date: 25/05/2026
 * Path: tests/components/layout/SidebarContext.test.tsx
 * Description: Tests for SidebarContext provider and useSidebar hook.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { SidebarProvider, useSidebar } from "@/components/layout/SidebarContext";

function TestComponent() {
  const { isCollapsed, isMobileOpen, theme, expandedKeys, toggleCollapse, toggleMobile, toggleTheme, toggleExpanded } = useSidebar();
  return (
    <div>
      <span data-testid="collapsed">{isCollapsed ? "true" : "false"}</span>
      <span data-testid="mobile">{isMobileOpen ? "true" : "false"}</span>
      <span data-testid="theme">{theme}</span>
      <span data-testid="expanded">{Array.from(expandedKeys).join(",")}</span>
      <button onClick={toggleCollapse}>Toggle Collapse</button>
      <button onClick={toggleMobile}>Toggle Mobile</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => toggleExpanded("sat")}>Toggle SAT</button>
      <button onClick={() => toggleExpanded("erp")}>Toggle ERP</button>
    </div>
  );
}

describe("SidebarContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("provides default state before hydration", () => {
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

  it("provides empty expanded keys by default", () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    expect(screen.getByTestId("expanded")).toHaveTextContent("");
  });

  it("toggles expanded key in the set", () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    act(() => {
      screen.getByRole("button", { name: /Toggle SAT/i }).click();
    });

    expect(screen.getByTestId("expanded")).toHaveTextContent("sat");

    act(() => {
      screen.getByRole("button", { name: /Toggle ERP/i }).click();
    });

    expect(screen.getByTestId("expanded")).toHaveTextContent("sat,erp");

    act(() => {
      screen.getByRole("button", { name: /Toggle SAT/i }).click();
    });

    expect(screen.getByTestId("expanded")).toHaveTextContent("erp");
  });

  it("persists expanded keys to localStorage", () => {
    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    act(() => {
      screen.getByRole("button", { name: /Toggle SAT/i }).click();
    });

    expect(localStorage.getItem("sidebar:expanded")).toBe(JSON.stringify(["sat"]));
  });

  it("reads persisted expanded keys from localStorage on hydration", () => {
    localStorage.setItem("sidebar:expanded", JSON.stringify(["sat", "settings"]));

    render(
      <SidebarProvider>
        <TestComponent />
      </SidebarProvider>
    );

    // After hydration effect runs
    act(() => {
      // trigger a re-render so the hydration effect has run
      screen.getByRole("button", { name: /Toggle Collapse/i }).click();
    });

    expect(screen.getByTestId("expanded")).toHaveTextContent("sat,settings");

    localStorage.removeItem("sidebar:expanded");
  });
});
