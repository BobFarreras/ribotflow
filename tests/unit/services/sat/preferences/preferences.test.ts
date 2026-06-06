/**
 * Creation/modification date: 06/06/2026
 * Path: tests/unit/services/sat/preferences/preferences.test.ts
 * Description: Unit tests for the preferences service. Mocks the Drizzle
 *              `db` so we can assert the read/write logic without a real
 *              connection. The upsert is the only mutation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const dbMock = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    onConflictDoUpdate: vi.fn(),
    returning: vi.fn(),
  };
  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.values.mockReturnValue(chain);
  chain.onConflictDoUpdate.mockReturnValue(chain);
  return chain;
});

vi.mock("@/db", () => ({ db: dbMock }));

import { preferencesService } from "@/services/sat/preferences";
import { DEFAULT_PREFERENCES } from "@/services/sat/preferences";

const USER = "u-1";
const { getUserPreferences, upsertUserPreferences } = preferencesService;

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.select.mockReturnValue(dbMock);
  dbMock.from.mockReturnValue(dbMock);
  dbMock.where.mockReturnValue(dbMock);
  dbMock.insert.mockReturnValue(dbMock);
  dbMock.values.mockReturnValue(dbMock);
  dbMock.onConflictDoUpdate.mockReturnValue(dbMock);
});

/* ================================================================
   getUserPreferences
   ================================================================ */

describe("getUserPreferences", () => {
  it("returns the row when it exists", async () => {
    dbMock.limit.mockResolvedValueOnce([
      { userId: USER, theme: "dark", locale: "es" },
    ]);
    const r = await getUserPreferences(USER);
    expect(r).toEqual({ userId: USER, theme: "dark", locale: "es" });
  });

  it("falls back to defaults when the row does not exist", async () => {
    dbMock.limit.mockResolvedValueOnce([]);
    const r = await getUserPreferences(USER);
    expect(r).toEqual({
      userId: USER,
      theme: DEFAULT_PREFERENCES.theme,
      locale: DEFAULT_PREFERENCES.locale,
    });
  });
});

/* ================================================================
   upsertUserPreferences
   ================================================================ */

describe("upsertUserPreferences", () => {
  it("returns the upserted DTO", async () => {
    dbMock.returning.mockResolvedValueOnce([
      { userId: USER, theme: "dark", locale: "es" },
    ]);
    const r = await upsertUserPreferences({
      userId: USER,
      theme: "dark",
      locale: "es",
    });
    expect(r).toEqual({ userId: USER, theme: "dark", locale: "es" });
    expect(dbMock.insert).toHaveBeenCalled();
    expect(dbMock.onConflictDoUpdate).toHaveBeenCalled();
  });

  it("uses defaults for omitted fields when first creating the row", async () => {
    dbMock.returning.mockResolvedValueOnce([
      { userId: USER, theme: "light", locale: "ca" },
    ]);
    await upsertUserPreferences({ userId: USER, theme: "dark" });
    expect(dbMock.values).toHaveBeenCalledWith(
      expect.objectContaining({ theme: "dark", locale: "ca" })
    );
  });

  it("only touches the provided fields in the SET clause", async () => {
    dbMock.returning.mockResolvedValueOnce([
      { userId: USER, theme: "dark", locale: "ca" },
    ]);
    await upsertUserPreferences({ userId: USER, theme: "dark" });
    const setArg = dbMock.onConflictDoUpdate.mock.calls[0][0].set;
    expect(setArg).toEqual(expect.objectContaining({ theme: "dark" }));
    expect(setArg).not.toHaveProperty("locale");
    expect(setArg).toHaveProperty("updatedAt");
  });
});
