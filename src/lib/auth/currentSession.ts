/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/auth/currentSession.ts
 * Description: Returns the user-agent and IP of the current HTTP
 *              request. Used by the active-sessions UI to identify
 *              "this device" when the JWT strategy is enabled (Auth.js
 *              does not expose a stable session-token cookie in that
 *              mode).
 */

import { headers } from "next/headers";

export interface SessionFingerprint {
  userAgent: string | null;
  ipAddress: string | null;
}

/**
 * Best-effort fingerprint of the current request. Two sessions from
 * the same browser on the same network will share the same fingerprint,
 * which is acceptable for the "current device" badge.
 */
export async function getCurrentSessionFingerprint(): Promise<SessionFingerprint> {
  const h = await headers();
  return {
    userAgent: h.get("user-agent") ?? null,
    ipAddress: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? null,
  };
}
