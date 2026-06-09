/* global console, process */

import { Pool } from "pg";
import { hash } from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const databaseUrl = process.env.DATABASE_URL;
const migrationsFolder = process.env.DRIZZLE_MIGRATIONS_FOLDER ?? "/app/src/db/migrations";

if (!databaseUrl) {
  console.error("[migrate] DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function seedInitialOwner() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const companyName = process.env.COMPANY_NAME ?? "RIBOTFLOW";

  if (!adminEmail || !adminPassword) {
    console.log("[seed] ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping initial owner seed.");
    return;
  }

  const companyCount = await pool.query("select id from companies limit 1");
  if (companyCount.rowCount > 0) {
    console.log("[seed] Existing company found. Skipping initial owner seed.");
    return;
  }

  const passwordHash = await hash(adminPassword, 12);
  const tenantSlug = slugify(companyName) || "ribotflow";

  const client = await pool.connect();
  try {
    await client.query("begin");
    const companyResult = await client.query(
      `insert into companies (name, tenant_slug, plan)
       values ($1, $2, 'free')
       returning id`,
      [companyName, tenantSlug]
    );
    const companyId = companyResult.rows[0].id;

    await client.query(
      `insert into users (company_id, email, password_hash, name, role, status)
       values ($1, $2, $3, $4, 'OWNER', 'active')`,
      [companyId, adminEmail, passwordHash, companyName]
    );

    await client.query(
      `insert into work_order_categories (company_id, name, slug, color, icon, is_default, sort_order)
       values
         ($1, 'Reparació', 'repair', '#ef4444', 'Wrench', true, 0),
         ($1, 'Manteniment', 'maintenance', '#3b82f6', 'ClipboardCheck', false, 1),
         ($1, 'Instal·lació', 'installation', '#22c55e', 'Package', false, 2),
         ($1, 'Muntatge', 'assembly', '#f59e0b', 'Hammer', false, 3),
         ($1, 'Revisió', 'inspection', '#8b5cf6', 'Search', false, 4)`,
      [companyId]
    );

    await client.query("commit");
    console.log(`[seed] Initial owner created: ${adminEmail}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await pool.query('create extension if not exists "pgcrypto"');
  console.log(`[migrate] Applying migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("[migrate] Database migrations completed.");
  await seedInitialOwner();
} catch (error) {
  console.error("[migrate] Database migration failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
