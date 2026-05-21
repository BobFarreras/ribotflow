/**
 * Creation/modification date: 21/05/2026
 * Path: src/app/layout.tsx
 * Description: Root layout with Inter font, dark mode support, and metadata.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RIBOTFLOW - Sistema Operativo Empresarial",
    template: "%s | RIBOTFLOW",
  },
  description: "ERP, SAT, CRM y Control de Acceso proactivo para empresas del 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
