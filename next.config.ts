/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: next.config.ts
 * Descripció: Configuració de Next.js amb suport per a standalone Docker build i Sentry.
 */

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
