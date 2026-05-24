/**
 * Creation/modification date: 21/05/2026
 * Path: src/db/index.ts
 * Description: Centralized Drizzle ORM instance. Works with any PostgreSQL-compatible database (PostgreSQL, Supabase, Neon).
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as authSchema from "./schema/auth";
import * as satSchema from "./schema/sat";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === "production" ? 20 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("[db] Unexpected error on idle client:", err);
});

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
    ...satSchema,
  },
});

export type Database = typeof db;

export async function testConnection() {
  try {
    await pool.query("SELECT 1");
    return { connected: true };
  } catch (error) {
    return { connected: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
