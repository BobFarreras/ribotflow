/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/app/layout.tsx
 * Descripció: Layout arrel de l'aplicació. Configura idioma, metadades i providers globals.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "RIBOTFLOW - Sistema Operatiu Empresarial",
    template: "%s | RIBOTFLOW",
  },
  description: "ERP, SAT, CRM i Control d'Accés proactiu per a empreses del 2026.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
