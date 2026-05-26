/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/SidebarContext.tsx
 * Description: React context for global sidebar state (collapsed, mobile open, theme).
 *              SSR-safe: defaults to open, then reads localStorage after hydration.
 */

"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SidebarContextValue {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isMobile: boolean;
  ready: boolean;
  expandedKeys: Set<string>;
  theme: "light" | "dark";
  toggleCollapse: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  toggleTheme: () => void;
  toggleExpanded: (key: string) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe: always start open. localStorage is read after hydration.
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Hydration: read persisted states from localStorage ONCE
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar:collapsed");
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === "true");
    }

    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    const savedExpanded = localStorage.getItem("sidebar:expanded");
    if (savedExpanded) {
      try {
        const parsed = JSON.parse(savedExpanded) as string[];
        setExpandedKeys(new Set(parsed));
      } catch {
        // ignore malformed JSON
      }
    }

    setReady(true);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar:collapsed", String(next));
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      localStorage.setItem("sidebar:expanded", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        isMobile,
        ready,
        expandedKeys,
        toggleCollapse,
        toggleMobile,
        closeMobile,
        theme,
        toggleTheme,
        toggleExpanded,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
