/**
 * Creation/modification date: 21/05/2026
 * Path: src/lib/errors/auth.ts
 * Description: Authentication-specific error classes.
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class EmailAlreadyExistsError extends AuthError {
  constructor() {
    super("An account with this email already exists");
    this.name = "EmailAlreadyExistsError";
  }
}

export class SetupAlreadyCompletedError extends AuthError {
  constructor() {
    super("Setup has already been completed");
    this.name = "SetupAlreadyCompletedError";
  }
}
