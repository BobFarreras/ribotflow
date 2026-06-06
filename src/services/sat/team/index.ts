/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/team/index.ts
 * Description: Public surface of the team service. Combines reads and
 *              mutations behind a single object so the action layer has one
 *              import to remember.
 */

import * as queries from "./queries";
import * as mutations from "./mutations";

export const teamService = {
  ...queries,
  ...mutations,
};

export type { TeamMember, TeamMemberView, TeamRole, UserStatus } from "./types";
