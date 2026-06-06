/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/lib/errors/team.test.ts
 * Description: Smoke tests for the team error classes. Ensures each
 *              error carries a stable `code` so the UI can map it to a
 *              translation key without parsing free-text messages.
 */

import { describe, it, expect } from "vitest";
import {
  CannotInviteOwnerError,
  CannotModifyOwnerError,
  CannotModifySelfError,
  InvalidInvitationTokenError,
  NotAPendingUserError,
  TeamError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from "@/lib/errors/team";

describe("team error classes", () => {
  const cases: [new () => TeamError, string][] = [
    [UserNotFoundError, "user_not_found"],
    [UserAlreadyExistsError, "user_already_exists"],
    [CannotModifySelfError, "cannot_modify_self"],
    [CannotModifyOwnerError, "cannot_modify_owner"],
    [InvalidInvitationTokenError, "invalid_invitation_token"],
    [NotAPendingUserError, "not_a_pending_user"],
    [CannotInviteOwnerError, "cannot_invite_owner"],
  ];

  it.each(cases)("%p carries code %p", (Ctor, code) => {
    const e = new Ctor();
    expect(e).toBeInstanceOf(TeamError);
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe(code);
    expect(typeof e.message).toBe("string");
    expect(e.message.length).toBeGreaterThan(0);
  });
});
