/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/team/invitations.ts
 * Description: Token generation for user invitations. Cryptographically random
 *              URL-safe string (32 bytes -> 43 base64url chars).
 */

import { randomBytes } from "crypto";

/** Returns a unique opaque token suitable for invitation URLs. */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Default lifetime of an invitation (7 days). */
export const INVITATION_TTL_DAYS = 7;

export function invitationExpiry(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + INVITATION_TTL_DAYS);
  return d;
}
