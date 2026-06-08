/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/profile/index.ts
 * Description: Public surface of the profile service.
 */

import * as queries from "./queries";
import * as mutations from "./mutations";

export const profileService = {
  ...queries,
  ...mutations,
};

export type { ProfileDto, UpdateNameInput, ChangePasswordInput } from "./types";
