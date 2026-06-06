/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/team/types.ts
 * Description: DTOs exposed by the team service. Kept separate from the
 *              Drizzle row types so the UI / actions don't depend on the
 *              schema module.
 */

export type UserStatus = "active" | "inactive" | "pending";

export type TeamRole = "OWNER" | "ADMIN" | "TECHNICIAN" | "OFFICE";

/** Row-shaped DTO returned to the UI / actions layer. */
export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  status: UserStatus;
  invitedBy: string | null;
  invitedAt: Date | null;
  invitationExpiresAt: Date | null;
  lastActiveAt: Date | null;
  createdAt: Date;
}

/** View-model shape used by the team page (denormalised for the UI). */
export interface TeamMemberView extends TeamMember {
  /** True when the current viewer is looking at their own row. */
  isSelf: boolean;
  /** True when this row is the company owner (immutable from the team page). */
  isOwner: boolean;
}
