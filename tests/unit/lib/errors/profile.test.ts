/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/lib/errors/profile.test.ts
 * Description: Smoke tests for the profile error classes.
 */

import { describe, it, expect } from "vitest";
import {
  IncorrectPasswordError,
  PasswordTooShortError,
  ProfileError,
  UserNotFoundError,
} from "@/lib/errors/profile";

describe("profile error classes", () => {
  const cases: [new () => ProfileError, string][] = [
    [UserNotFoundError, "user_not_found"],
    [IncorrectPasswordError, "incorrect_password"],
    [PasswordTooShortError, "password_too_short"],
  ];

  it.each(cases)("%p carries code %p", (Ctor, code) => {
    const e = new Ctor();
    expect(e).toBeInstanceOf(ProfileError);
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe(code);
    expect(typeof e.message).toBe("string");
    expect(e.message.length).toBeGreaterThan(0);
  });
});
