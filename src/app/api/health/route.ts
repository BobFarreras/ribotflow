/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/app/api/health/route.ts
 * Descripció: Endpoint de health check per a monitorització i load balancers.
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const checks: Record<string, string> = {};

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = "connected";
  } catch {
    checks.database = "disconnected";
  }

  const isHealthy = checks.database === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      mode: process.env.NEXT_PUBLIC_APP_MODE ?? "unknown",
    },
    { status: isHealthy ? 200 : 503 }
  );
}
