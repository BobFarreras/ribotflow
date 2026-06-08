/**
 * Creation/modification date: 24/05/2026
 * Path: tests/db-setup.ts
 * Description: Test database setup script. Creates test DB, applies migrations, and seeds initial data.
 */

import { Client } from "pg";
import { execSync } from "child_process";
import { config } from "dotenv";

// Load .env.test.local or .env.local
config({ path: ".env.test.local" });
if (!process.env.TEST_DATABASE_URL) {
  config({ path: ".env.local" });
}

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!TEST_DATABASE_URL) {
  console.error("❌ ERROR: TEST_DATABASE_URL or DATABASE_URL must be set.");
  console.error("   Copy .env.test.example to .env.test.local and configure it.");
  process.exit(1);
}

// Extract database name from URL
const dbName = new URL(TEST_DATABASE_URL).pathname.replace("/", "");
const baseUrl = TEST_DATABASE_URL.replace(`/${dbName}`, "/postgres");

async function setupTestDatabase() {
  console.log(`🧪 Setting up test database: ${dbName}`);

  const client = new Client({ connectionString: baseUrl });

  try {
    await client.connect();

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (result.rowCount === 0) {
      console.log(`   Creating database: ${dbName}`);
      await client.query(`CREATE DATABASE "${dbName}"`);
    } else {
      console.log(`   Database already exists: ${dbName}`);
    }

    await client.end();

    // Apply Drizzle migrations
    console.log("   Applying Drizzle migrations...");
    execSync("pnpm db:push", {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: "inherit",
    });

    console.log("✅ Test database setup complete!");
  } catch (error) {
    console.error("❌ Failed to setup test database:", error);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

setupTestDatabase();
