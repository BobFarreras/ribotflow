/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/app/api/auth/[...nextauth]/route.ts
 * Descripció: Handler d'Auth.js per a totes les rutes d'autenticació.
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
