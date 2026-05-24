/**
 * Creation/modification date: 21/05/2026
 * Path: drizzle.config.ts
 * Description: Drizzle ORM configuration for database migrations and schema generation.
 */

import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema/*.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/ribotflow",
  },
  verbose: true,
  strict: false,
});
