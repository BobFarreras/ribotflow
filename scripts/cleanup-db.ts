import { db } from "../src/db";
import { users, companies } from "../src/db/schema/auth";
import { sql, inArray, notInArray } from "drizzle-orm";

async function cleanup() {
  console.log("🧹 Cleaning up database users...");

  // Get all users ordered by creation date
  const allUsers = await db
    .select({ id: users.id, email: users.email, createdAt: users.createdAt })
    .from(users)
    .orderBy(users.createdAt);

  console.log(`Found ${allUsers.length} users:`);
  allUsers.forEach((u) => console.log(`  - ${u.email} (${u.createdAt.toISOString()})`));

  if (allUsers.length <= 4) {
    console.log("✅ 4 or fewer users found. No cleanup needed.");
    return;
  }

  // Keep the 4 most recent users (including test user)
  const keepIds = allUsers.slice(-4).map((u) => u.id);
  const deleteCount = allUsers.length - 4;

  console.log(`\n🗑️  Deleting ${deleteCount} oldest users...`);

  // Delete users not in keepIds
  await db.delete(users).where(notInArray(users.id, keepIds));

  // Clean up orphaned companies (companies with no users)
  const orphanedCompanies = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .leftJoin(users, sql`${users.companyId} = ${companies.id}`)
    .where(sql`${users.id} IS NULL`);

  if (orphanedCompanies.length > 0) {
    console.log(`\n🗑️  Deleting ${orphanedCompanies.length} orphaned companies:`);
    orphanedCompanies.forEach((c) => console.log(`  - ${c.name}`));

    await db
      .delete(companies)
      .where(
        inArray(companies.id, orphanedCompanies.map((c) => c.id))
      );
  }

  console.log("\n✅ Cleanup complete!");
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
