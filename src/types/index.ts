/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/types/index.ts
 * Descripció: Tipus globals compartits per tota l'aplicació.
 */

export type Role = "OWNER" | "ADMIN" | "TECHNICIAN" | "OFFICE";
export type Plan = "free" | "plus" | "enterprise";
export type AppMode = "cloud" | "self_hosted";
export type Locale = "ca" | "es";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  tenantSlug: string;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser extends User {}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
  interface User {
    id: string;
    companyId: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    companyId: string;
    role: Role;
  }
}
