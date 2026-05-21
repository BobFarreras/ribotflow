/**
 * Creation/modification date: 21/05/2026
 * Path: src/instrumentation.ts
 * Description: Sentry instrumentation placeholder. Activated when @sentry/nextjs is installed.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dsn = process.env.SENTRY_DSN;
    const mode = process.env.NEXT_PUBLIC_APP_MODE;

    if (dsn && mode === "cloud") {
      // Sentry will be initialized when @sentry/nextjs is installed
      // await import("@sentry/nextjs");
    }
  }
}
