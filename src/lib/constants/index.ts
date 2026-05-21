/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/lib/constants/index.ts
 * Descripció: Constants globals de l'aplicació: rutes, rols, configuració de plans.
 */

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  SETUP: "/setup",
  DASHBOARD: "/dashboard",
  UNAUTHORIZED: "/dashboard/unauthorized",
  SAT: "/dashboard/sat",
  ERP: "/dashboard/erp",
  BILLING: "/dashboard/billing",
  CRM: "/dashboard/crm",
  ACCESS: "/dashboard/access",
  SETTINGS: "/dashboard/settings",
  API_HEALTH: "/api/health",
} as const;

export const ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  TECHNICIAN: "TECHNICIAN",
  OFFICE: "OFFICE",
} as const;

export const PLANS = {
  FREE: "free",
  PLUS: "plus",
  ENTERPRISE: "enterprise",
} as const;

export const APP_MODES = {
  CLOUD: "cloud",
  SELF_HOSTED: "self_hosted",
} as const;

export const LOCALES = {
  CA: "ca",
  ES: "es",
} as const;

export const DEFAULT_LOCALE = LOCALES.CA;
