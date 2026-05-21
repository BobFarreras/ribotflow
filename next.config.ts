/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: next.config.ts
 * Descripció: Configuració de Next.js amb suport per a standalone Docker build i Sentry.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
