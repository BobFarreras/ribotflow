/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/team/mutations.ts
 * Description: Write-side operations for the team service. Each mutation
 *              returns the updated `TeamMember` DTO so the action layer can
 *              forward it to the client without an extra round-trip.
 */

import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { and, eq } from "drizzle-orm";
import { generateInvitationToken, invitationExpiry } from "./utils/invitations";
import type { TeamMember, TeamRole } from "./types";
import { hashPassword } from "@/lib/utils/crypto";
import {
  CannotInviteOwnerError,
  CannotModifyOwnerError,
  CannotModifySelfError,
  InvalidInvitationTokenError,
  NotAPendingUserError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from "@/lib/errors/team";
import { PasswordTooShortError } from "@/lib/errors/profile";
import {
  companyHasOwner,
  countActiveAdminsExcluding,
  findTeamMember,
} from "./queries";

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */

function rowToDto(r: typeof users.$inferSelect): TeamMember {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role as TeamRole,
    status: r.status as TeamMember["status"],
    invitedBy: r.invitedBy,
    invitedAt: r.invitedAt,
    invitationExpiresAt: r.invitationExpiresAt,
    lastActiveAt: r.lastActiveAt,
    createdAt: r.createdAt,
  };
}

/* ----------------------------------------------------------------
   Invitations
   ---------------------------------------------------------------- */

export interface InviteUserArgs {
  companyId: string;
  email: string;
  name: string;
  role: Exclude<TeamRole, "OWNER">;
  invitedBy: string;
}

export interface InviteUserResult {
  member: TeamMember;
  invitationToken: string;
}

export async function inviteUser(args: InviteUserArgs): Promise<InviteUserResult> {
  // Defensive: the type already excludes OWNER, but if a caller bypasses TS
  // the service still rejects it.
  if (args.role === ("OWNER" as InviteUserArgs["role"])) {
    throw new CannotInviteOwnerError();
  }

  // Check whether the email is already taken inside this company OR another
  // company. The `users.email` column is globally unique, so any other tenant
  // is enough to block the invitation.
  const existing = await db
    .select({ id: users.id, companyId: users.companyId, status: users.status })
    .from(users)
    .where(eq(users.email, args.email))
    .limit(1);

  if (existing.length > 0) {
    throw new UserAlreadyExistsError();
  }

  const token = generateInvitationToken();
  const expiresAt = invitationExpiry();
  const now = new Date();

  const [row] = await db
    .insert(users)
    .values({
      companyId: args.companyId,
      email: args.email,
      name: args.name,
      role: args.role,
      status: "pending",
      invitationToken: token,
      invitationExpiresAt: expiresAt,
      invitedBy: args.invitedBy,
      invitedAt: now,
      // passwordHash stays NULL until the user accepts the invitation.
    })
    .returning();

  return {
    member: rowToDto(row),
    invitationToken: token,
  };
}

/** Issues a fresh token and extends the expiry for a pending invitation. */
export async function resendInvitation(
  companyId: string,
  userId: string
): Promise<{ member: TeamMember; invitationToken: string }> {
  const member = await findTeamMember(companyId, userId);
  if (!member) throw new UserNotFoundError();
  if (member.status !== "pending") throw new NotAPendingUserError();
  if (member.role === "OWNER") throw new CannotModifyOwnerError();

  const token = generateInvitationToken();
  const expiresAt = invitationExpiry();

  const [row] = await db
    .update(users)
    .set({
      invitationToken: token,
      invitationExpiresAt: expiresAt,
      invitedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(users.companyId, companyId), eq(users.id, userId)))
    .returning();

  return { member: rowToDto(row), invitationToken: token };
}

/** Cancels a pending invitation (deletes the row). */
export async function revokeInvitation(companyId: string, userId: string): Promise<void> {
  const member = await findTeamMember(companyId, userId);
  if (!member) throw new UserNotFoundError();
  if (member.role === "OWNER") throw new CannotModifyOwnerError();
  if (member.status !== "pending") throw new NotAPendingUserError();

  await db
    .delete(users)
    .where(and(eq(users.companyId, companyId), eq(users.id, userId)));
}

/** Validates an invitation token. Returns the user row or throws. */
export async function acceptInvitationToken(token: string): Promise<TeamMember> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.invitationToken, token))
    .limit(1);
  const row = rows[0];
  if (!row) throw new InvalidInvitationTokenError();
  if (row.status !== "pending") throw new NotAPendingUserError();
  if (!row.invitationExpiresAt || row.invitationExpiresAt < new Date()) {
    throw new InvalidInvitationTokenError();
  }
  return rowToDto(row);
}

/* ----------------------------------------------------------------
   Role changes
   ---------------------------------------------------------------- */

export async function changeUserRole(
  companyId: string,
  userId: string,
  newRole: TeamRole,
  actorId: string
): Promise<TeamMember> {
  const member = await findTeamMember(companyId, userId);
  if (!member) throw new UserNotFoundError();
  if (member.role === "OWNER") throw new CannotModifyOwnerError();
  if (userId === actorId) throw new CannotModifySelfError();

  if (newRole === "OWNER" && (await companyHasOwner(companyId))) {
    throw new CannotInviteOwnerError();
  }

  const [row] = await db
    .update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(and(eq(users.companyId, companyId), eq(users.id, userId)))
    .returning();

  return rowToDto(row);
}

/* ----------------------------------------------------------------
   Status changes
   ---------------------------------------------------------------- */

export async function deactivateUser(
  companyId: string,
  userId: string,
  actorId: string
): Promise<TeamMember> {
  const member = await findTeamMember(companyId, userId);
  if (!member) throw new UserNotFoundError();
  if (member.role === "OWNER") throw new CannotModifyOwnerError();
  if (userId === actorId) throw new CannotModifySelfError();
  if (member.status === "inactive") return member; // no-op idempotent

  // Safety net: keep at least one active account in the company.
  const remaining = await countActiveAdminsExcluding(companyId, userId);
  if (remaining === 0) {
    throw new CannotModifyOwnerError(); // reuse: "no other active users"
  }

  const [row] = await db
    .update(users)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(and(eq(users.companyId, companyId), eq(users.id, userId)))
    .returning();

  return rowToDto(row);
}

export async function reactivateUser(companyId: string, userId: string): Promise<TeamMember> {
  const member = await findTeamMember(companyId, userId);
  if (!member) throw new UserNotFoundError();
  if (member.role === "OWNER") throw new CannotModifyOwnerError();
  if (member.status === "active") return member; // no-op idempotent

  const [row] = await db
    .update(users)
    .set({ status: "active", updatedAt: new Date() })
    .where(and(eq(users.companyId, companyId), eq(users.id, userId)))
    .returning();

  return rowToDto(row);
}

/* ----------------------------------------------------------------
   Public invitation acceptance (no auth required)
   ---------------------------------------------------------------- */

/**
 * Minimum password length for newly-accepted invitations. Mirrors the
 * value enforced by the profile `changePassword` flow.
 */
const MIN_INVITATION_PASSWORD = 8;

export interface AcceptInvitationResult {
  /** The user that just completed onboarding, for the auto-login step. */
  member: TeamMember;
}

/**
 * Validates an invitation token and finalises the invited user's
 * account: hashes the new password, marks the user as `active`, and
 * clears the invitation token + expiry so the link cannot be reused.
 *
 * Public: does NOT require an authenticated session. The token itself
 * is the credential.
 */
export async function acceptInvitation(args: {
  token: string;
  password: string;
}): Promise<AcceptInvitationResult> {
  if (args.password.length < MIN_INVITATION_PASSWORD) {
    throw new PasswordTooShortError();
  }
  // Re-uses the existing validator which checks token existence,
  // pending status, and expiry.
  const member = await acceptInvitationToken(args.token);

  const passwordHash = await hashPassword(args.password);
  const [row] = await db
    .update(users)
    .set({
      passwordHash,
      status: "active",
      invitationToken: null,
      invitationExpiresAt: null,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, member.id))
    .returning();

  return { member: rowToDto(row) };
}
