/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/errors/team.ts
 * Description: Error classes for the team management domain (user invitations,
 *              role changes, status transitions). Each error carries a stable
 *              `code` so the UI layer can map it to a translation key without
 *              parsing free-text messages.
 */

export class TeamError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "TeamError";
  }
}

export class UserNotFoundError extends TeamError {
  constructor() {
    super("User not found", "user_not_found");
    this.name = "UserNotFoundError";
  }
}

export class UserAlreadyExistsError extends TeamError {
  constructor() {
    super("An invited user with this email already has a pending invitation", "user_already_exists");
    this.name = "UserAlreadyExistsError";
  }
}

export class CannotModifySelfError extends TeamError {
  constructor() {
    super("You cannot change your own role or status", "cannot_modify_self");
    this.name = "CannotModifySelfError";
  }
}

export class CannotModifyOwnerError extends TeamError {
  constructor() {
    super("The company owner cannot be deactivated or have their role changed", "cannot_modify_owner");
    this.name = "CannotModifyOwnerError";
  }
}

export class InvalidInvitationTokenError extends TeamError {
  constructor() {
    super("This invitation link is invalid or has expired", "invalid_invitation_token");
    this.name = "InvalidInvitationTokenError";
  }
}

export class NotAPendingUserError extends TeamError {
  constructor() {
    super("This user has already completed their invitation", "not_a_pending_user");
    this.name = "NotAPendingUserError";
  }
}

export class CannotInviteOwnerError extends TeamError {
  constructor() {
    super("There is already an owner for this company", "cannot_invite_owner");
    this.name = "CannotInviteOwnerError";
  }
}
