/**
 * Creation/modification date: 24/05/2026
 * Path: src/actions/auth/login.ts
 * Description: Server Action for user login credential validation. Does NOT sign in (client does that).
 */

"use server";

import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/utils/crypto";

export async function loginAction(rawInput: unknown) {
  try {
    const input = loginSchema.parse(rawInput);

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        companyId: users.companyId,
        name: users.name,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (user.length === 0) {
      return { success: false, error: "Invalid email or password" };
    }

    // Pending and inactive users cannot sign in with a password.
    if (user[0].status !== "active") {
      return { success: false, error: "Invalid email or password" };
    }

    // Invited users without a password cannot authenticate.
    if (!user[0].passwordHash) {
      return { success: false, error: "Invalid email or password" };
    }

    const isValid = await verifyPassword(input.password, user[0].passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Invalid email or password" };
  }
}
