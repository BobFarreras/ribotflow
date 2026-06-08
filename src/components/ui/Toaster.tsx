/**
 * Creation/modification date: 28/05/2026
 * Path: src/components/ui/Toaster.tsx
 * Description: Toast notification component using Sonner.
 */

"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--surface)",
          color: "var(--text)",
          border: "1px solid var(--border)",
        },
      }}
    />
  );
}
