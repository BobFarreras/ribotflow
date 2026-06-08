/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/validators/sat/sessionsSchema.ts
 * Description: Zod schemas for the active-sessions actions.
 */

import { z } from "zod";

export const sessionIdSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a UUID"),
});
