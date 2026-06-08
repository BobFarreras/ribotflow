/**
 * Creation/modification date: 06/06/2026
 * Path: src/lib/errors/profile.ts
 * Description: Error classes for the user profile domain. Each carries a
 *              stable `code` so the UI layer can map it to a translation
 *              key without parsing free-text messages.
 */

export class ProfileError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

export class UserNotFoundError extends ProfileError {
  constructor() {
    super("User not found", "user_not_found");
    this.name = "UserNotFoundError";
  }
}

export class IncorrectPasswordError extends ProfileError {
  constructor() {
    super("Current password is incorrect", "incorrect_password");
    this.name = "IncorrectPasswordError";
  }
}

export class PasswordTooShortError extends ProfileError {
  constructor() {
    super("Password must be at least 8 characters", "password_too_short");
    this.name = "PasswordTooShortError";
  }
}
