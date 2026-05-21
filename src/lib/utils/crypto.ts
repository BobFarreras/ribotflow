/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/lib/utils/crypto.ts
 * Descripció: Utilitats criptogràfiques per a verificació de contrasenyes i hashing.
 */

import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}
