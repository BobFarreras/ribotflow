/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/instrumentation.ts
 * Descripció: Instrumentació de Sentry. Només s'activa en mode cloud o si Sentry està configurat.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dsn = process.env.SENTRY_DSN;
    const mode = process.env.NEXT_PUBLIC_APP_MODE;

    if (dsn && mode === "cloud") {
      await import("@sentry/nextjs");
    }
  }
}
