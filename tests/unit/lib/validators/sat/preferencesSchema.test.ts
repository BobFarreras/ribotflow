/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/lib/validators/sat/preferencesSchema.test.ts
 * Description: Zod schema tests for the preferences actions.
 */

import { describe, it, expect } from "vitest";
import {
  themeSchema,
  localeSchema,
  updatePreferencesSchema,
} from "@/lib/validators/sat/preferencesSchema";

describe("themeSchema", () => {
  it("accepts light/dark", () => {
    expect(themeSchema.safeParse("light").success).toBe(true);
    expect(themeSchema.safeParse("dark").success).toBe(true);
  });
  it("rejects anything else", () => {
    expect(themeSchema.safeParse("system").success).toBe(false);
    expect(themeSchema.safeParse("").success).toBe(false);
    expect(themeSchema.safeParse(null).success).toBe(false);
  });
});

describe("localeSchema", () => {
  it("accepts ca/es", () => {
    expect(localeSchema.safeParse("ca").success).toBe(true);
    expect(localeSchema.safeParse("es").success).toBe(true);
  });
  it("rejects anything else", () => {
    expect(localeSchema.safeParse("en").success).toBe(false);
    expect(localeSchema.safeParse("fr").success).toBe(false);
  });
});

describe("updatePreferencesSchema", () => {
  it("accepts a single theme", () => {
    const r = updatePreferencesSchema.safeParse({ theme: "dark" });
    expect(r.success).toBe(true);
  });

  it("accepts a single locale", () => {
    const r = updatePreferencesSchema.safeParse({ locale: "es" });
    expect(r.success).toBe(true);
  });

  it("accepts both", () => {
    const r = updatePreferencesSchema.safeParse({ theme: "light", locale: "es" });
    expect(r.success).toBe(true);
  });

  it("rejects an empty object (nothing to update)", () => {
    const r = updatePreferencesSchema.safeParse({});
    expect(r.success).toBe(false);
  });

  it("rejects an unknown theme", () => {
    const r = updatePreferencesSchema.safeParse({ theme: "blue" });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown locale", () => {
    const r = updatePreferencesSchema.safeParse({ locale: "fr" });
    expect(r.success).toBe(false);
  });
});
