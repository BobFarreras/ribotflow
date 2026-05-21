/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/db/index.ts
 * Descripció: Instància centralitzada de Drizzle ORM amb connexió a PostgreSQL.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as authSchema from "./schema/auth";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === "production" ? 20 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, {
  schema: {
    ...authSchema,
  },
});

export type Database = typeof db;
