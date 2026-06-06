/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/sessions/index.ts
 * Description: Public surface of the sessions service.
 */

import * as queries from "./queries";
import * as mutations from "./mutations";

export const sessionsService = {
  ...queries,
  ...mutations,
};

export type { ActiveSessionDto } from "./types";
export { SessionNotFoundError, CannotRevokeCurrentSessionError } from "./mutations";
