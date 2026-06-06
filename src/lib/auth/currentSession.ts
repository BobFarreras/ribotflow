/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/auth/currentSession.ts
 * Description: Returns the PK (uuid) of the session row matching the
 *              Auth.js cookie. Used by the active-sessions Server Actions
 *              to identify "this device" so the user can never
 *              accidentally revoke their own browser.
 *
 *              The cookie name differs by environment: in dev we use
 *              `authjs.session-token`, in prod behind https we use
 *              `__Secure-authjs.session-token`.
 */

import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

const DEV_COOKIE = "authjs.session-token";
const SECURE_COOKIE = "__Secure-authjs.session-token";

async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SECURE_COOKIE)?.value ?? store.get(DEV_COOKIE)?.value ?? null;
}

/**
 * Resolves the PK of the current Auth.js database session. Returns
 * `null` if the cookie is missing, malformed, or the session row no
 * longer exists.
 */
export async function getCurrentSessionId(): Promise<string | null> {
  const token = await readSessionToken();
  if (!token) return null;

  const [row] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.sessionToken, token))
    .limit(1);
  return row?.id ?? null;
}
