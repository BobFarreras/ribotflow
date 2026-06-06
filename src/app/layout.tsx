/**
 * Creation/modification date: 06/06/2026
 * Path: src/app/layout.tsx
 * Description: Root layout. Reads the active theme and locale from the
 *              preference cookies so the first paint renders with the
 *              correct <html lang> and dark class. The inline script
 *              runs before any React hydration and is the anti-FOUC
 *              safety net for theme changes that happen on a different
 *              page than /settings/profile.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { SessionProvider } from "next-auth/react";
import { readThemeCookie, readLocaleCookie } from "@/lib/cookies/preferencesCookies";
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

/**
 * Inline script that runs before React hydration. It syncs the
 * `data-theme` attribute and `.dark` class on <html> with the value
 * the user has stored. Without it, the first paint always renders in
 * light mode, producing a brief flash for dark-mode users.
 */
const ANTI_FOUC_SCRIPT = `
(function () {
  try {
    var t = document.cookie.match(/(?:^|; )ribot_theme=([^;]+)/);
    var theme = t ? decodeURIComponent(t[1]) : 'light';
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.setAttribute('data-theme', theme);
  } catch (e) { /* noop */ }
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  const initialTheme = await readThemeCookie();
  const initialLocale = await readLocaleCookie();

  return (
    <html
      lang={initialLocale}
      data-theme={initialTheme}
      className={`${inter.variable}${initialTheme === "dark" ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTI_FOUC_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
