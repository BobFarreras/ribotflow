/**
 * Creation/modification date: 25/05/2026
 * Path: tests/components/layout/DashboardShell.test.tsx
 * Description: Tests for DashboardShell responsive padding behavior.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardShell from "@/components/layout/DashboardShell";
import { SidebarProvider } from "@/components/layout/SidebarContext";

describe("DashboardShell", () => {
  it("renders children correctly", () => {
    render(
      <SidebarProvider>
        <DashboardShell>
          <div data-testid="child">Content</div>
        </DashboardShell>
      </SidebarProvider>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Content");
  });

  it("has min-h-screen class", () => {
    render(
      <SidebarProvider>
        <DashboardShell>
          <div>Content</div>
        </DashboardShell>
      </SidebarProvider>
    );

    const shell = screen.getByText("Content").parentElement;
    expect(shell).toHaveClass("min-h-screen");
  });

  it("applies flex flex-col classes", () => {
    render(
      <SidebarProvider>
        <DashboardShell>
          <div>Content</div>
        </DashboardShell>
      </SidebarProvider>
    );

    const shell = screen.getByText("Content").parentElement;
    expect(shell).toHaveClass("flex");
    expect(shell).toHaveClass("flex-col");
  });
});
