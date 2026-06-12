/**
 * Creation/modification date: 12/06/2026
 * Path: src/services/sat/quotes/tokens.ts
 * Description: Token generation for public quote sharing.
 *              Cryptographically random URL-safe string (32 bytes → 43 base64url chars).
 */

import { randomBytes } from "crypto";

/** Returns a unique opaque token suitable for public quote URLs. */
export function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Default lifetime of a share link (30 days). */
export const SHARE_TOKEN_TTL_DAYS = 30;

export function shareTokenExpiry(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + SHARE_TOKEN_TTL_DAYS);
  return d;
}
