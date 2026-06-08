/**
 * Creation/modification date: 24/05/2026
 * Path: tests/factories/user.factory.ts
 * Description: Factory for generating test user data.
 */

import type { Role } from "@/types";

export interface UserFactoryParams {
  id?: string;
  companyId?: string;
  email?: string;
  name?: string;
  role?: Role;
  passwordHash?: string;
}

export function createUserFactory(params: UserFactoryParams = {}) {
  return {
    id: params.id ?? crypto.randomUUID(),
    companyId: params.companyId ?? crypto.randomUUID(),
    email: params.email ?? `user-${Date.now()}@test.com`,
    name: params.name ?? "Test User",
    role: params.role ?? "TECHNICIAN",
    passwordHash: params.passwordHash ?? "$2a$10$mockhash", // bcrypt mock
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
