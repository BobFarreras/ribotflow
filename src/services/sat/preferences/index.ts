/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/preferences/index.ts
 * Description: Public surface of the preferences service.
 */

import * as queries from "./queries";
import * as mutations from "./mutations";

export const preferencesService = {
  ...queries,
  ...mutations,
};

export type {
  UserPreferencesDto,
  UpsertPreferencesInput,
  ThemePreference,
  LocalePreference,
} from "./types";
export { DEFAULT_PREFERENCES } from "./types";
