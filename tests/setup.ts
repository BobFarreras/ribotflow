/**
 * Creation/modification date: 24/05/2026
 * Path: tests/setup.ts
 * Description: Vitest setup file. Loads environment variables for integration tests.
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

// Load .env.test.local if it exists (for CI/CD and local test overrides)
const testEnvPath = resolve(process.cwd(), ".env.test.local");
if (existsSync(testEnvPath)) {
  config({ path: testEnvPath });
}

// Fallback to .env.local for local development
const localEnvPath = resolve(process.cwd(), ".env.local");
if (existsSync(localEnvPath) && !process.env.TEST_DATABASE_URL) {
  config({ path: localEnvPath });
}

// If TEST_DATABASE_URL is set, override DATABASE_URL for tests
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Ensure AUTH_SECRET is set for tests
if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-secret-key-minimum-32-chars-long";
}
