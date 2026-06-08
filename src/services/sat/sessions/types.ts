/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/sessions/types.ts
 * Description: DTOs for the active-sessions list shown at /settings/profile.
 */

export interface ActiveSessionDto {
  /** PK of the row in the `sessions` table. Used to revoke. */
  id: string;
  /** When the session was created (= sign-in time). */
  createdAt: Date;
  /** Last time the session was checked. */
  lastUsedAt: Date;
  /** Expiry timestamp. */
  expires: Date;
  /** Best-effort user agent string captured at sign-in. */
  userAgent: string | null;
  /** Best-effort IP address captured at sign-in. */
  ipAddress: string | null;
}
