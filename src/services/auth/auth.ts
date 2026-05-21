/**
 * Creation/modification date: 21/05/2026
 * Path: src/services/auth/auth.ts
 * Description: Framework-agnostic authentication service. Handles user creation, registration, and setup.
 */

import { db } from "@/db";
import { companies, users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/utils/crypto";
import { EmailAlreadyExistsError, SetupAlreadyCompletedError } from "@/lib/errors/auth";

export const authService = {
  async createCompanyAndOwner(input: {
    companyName: string;
    email: string;
    password: string;
  }) {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new EmailAlreadyExistsError();
    }

    const slug = input.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const [company] = await db
      .insert(companies)
      .values({
        name: input.companyName,
        tenantSlug: slug,
        plan: "free",
      })
      .returning();

    const passwordHash = await hashPassword(input.password);

    const [user] = await db
      .insert(users)
      .values({
        companyId: company.id,
        email: input.email,
        passwordHash,
        name: input.companyName,
        role: "OWNER",
      })
      .returning();

    return { company, user };
  },

  async registerUser(input: {
    name: string;
    email: string;
    password: string;
    companyId: string;
    role: "ADMIN" | "TECHNICIAN" | "OFFICE";
  }) {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new EmailAlreadyExistsError();
    }

    const passwordHash = await hashPassword(input.password);

    const [user] = await db
      .insert(users)
      .values({
        companyId: input.companyId,
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
      })
      .returning();

    return user;
  },

  async isSetupCompleted() {
    const result = await db.select({ count: companies.id }).from(companies).limit(1);
    return result.length > 0;
  },
};
