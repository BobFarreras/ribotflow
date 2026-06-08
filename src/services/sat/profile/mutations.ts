/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/profile/mutations.ts
 * Description: Write-side operations for the user profile.
 *              - updateName: change the displayed name
 *              - changePassword: verify current, set new (hashed)
 *              - uploadAvatar / removeAvatar: write to the configured
 *                FileStorage and persist the public URL on users.avatarUrl
 */

import { db } from "@/db";
import { companies, users } from "@/db/schema/auth";
import { and, eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/utils/crypto";
import { createFileStorage } from "@/services/storage/factory";
import {
  buildStorageContext,
  buildUserAvatarKey,
  getUserAvatarPrefix,
} from "@/lib/utils/storageKeys";
import type { ChangePasswordInput, UpdateNameInput } from "./types";
import { getPasswordHash } from "./queries";
import { IncorrectPasswordError, UserNotFoundError } from "@/lib/errors/profile";

/* ----------------------------------------------------------------
   Name
   ---------------------------------------------------------------- */

export async function updateName(input: UpdateNameInput): Promise<{ name: string }> {
  const [row] = await db
    .update(users)
    .set({ name: input.name, updatedAt: new Date() })
    .where(and(eq(users.id, input.userId), eq(users.companyId, input.companyId)))
    .returning({ name: users.name });

  if (!row) throw new UserNotFoundError();
  return row;
}

/* ----------------------------------------------------------------
   Password
   ---------------------------------------------------------------- */

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const currentHash = await getPasswordHash(input.companyId, input.userId);
  if (!currentHash) {
    // Either the user does not exist (cross-tenant) or the user is pending
    // (no password yet). Treat as "not found" from the profile perspective.
    throw new UserNotFoundError();
  }

  const matches = await verifyPassword(input.currentPassword, currentHash);
  if (!matches) {
    throw new IncorrectPasswordError();
  }

  const newHash = await hashPassword(input.newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(and(eq(users.id, input.userId), eq(users.companyId, input.companyId)));
}

/* ----------------------------------------------------------------
   Avatar
   ---------------------------------------------------------------- */

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

function safeExt(fileName: string, mimeType: string): string {
  const fromName = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".") + 1) : "";
  const cleaned = fromName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (cleaned) return cleaned;
  const fromMime = mimeType.split("/")[1] ?? "png";
  return fromMime.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
}

/**
 * Best-effort: find the previous avatar storage key by listing the user
 * prefix and picking the most recent one. Returns null if listing is
 * not supported by the underlying storage.
 */
async function findPreviousAvatarKey(
  storage: ReturnType<typeof createFileStorage>,
  ctx: ReturnType<typeof buildStorageContext>,
  userId: string
): Promise<string | null> {
  if (typeof (storage as { listObjects?: unknown }).listObjects === "function") {
    const prefix = getUserAvatarPrefix(ctx, userId);
    const keys = await (
      storage as unknown as { listObjects: (p: string) => Promise<string[]> }
    ).listObjects(prefix);
    if (keys.length === 0) return null;
    keys.sort();
    return keys[keys.length - 1];
  }
  return null;
}

export interface UploadAvatarResult {
  avatarUrl: string;
}

export async function uploadAvatar(input: {
  companyId: string;
  userId: string;
  tenantSlug: string;
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<UploadAvatarResult> {
  if (!ALLOWED_MIME.has(input.mimeType)) {
    throw new Error("Unsupported image format");
  }
  if (input.buffer.length === 0) {
    throw new Error("Empty file");
  }
  if (input.buffer.length > MAX_AVATAR_BYTES) {
    throw new Error("File too large (max 2 MB)");
  }

  const ext = safeExt(input.fileName, input.mimeType);
  const ctx = buildStorageContext({
    companyId: input.companyId,
    tenantSlug: input.tenantSlug,
    clientId: input.companyId,
    clientName: input.tenantSlug,
  });
  const storageKey = buildUserAvatarKey(ctx, input.userId, ext);
  const storage = createFileStorage();

  // Best-effort cleanup of any previous avatar for this user.
  try {
    const previousKey = await findPreviousAvatarKey(storage, ctx, input.userId);
    if (previousKey) await storage.delete(previousKey);
  } catch {
    // Non-fatal: storage may be empty or unavailable.
  }

  const uploaded = await storage.upload({
    buffer: input.buffer,
    storageKey,
    mimeType: input.mimeType,
    metadata: {
      userId: input.userId,
      uploadedAt: new Date().toISOString(),
    },
  });

  await db
    .update(users)
    .set({ avatarUrl: uploaded.publicUrl, updatedAt: new Date() })
    .where(and(eq(users.id, input.userId), eq(users.companyId, input.companyId)));

  return { avatarUrl: uploaded.publicUrl };
}

export async function removeAvatar(input: {
  companyId: string;
  userId: string;
  tenantSlug: string;
}): Promise<void> {
  await db
    .update(users)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(and(eq(users.id, input.userId), eq(users.companyId, input.companyId)));
  // Storage cleanup is best-effort — a stale object is harmless.
  try {
    const ctx = buildStorageContext({
      companyId: input.companyId,
      tenantSlug: input.tenantSlug,
      clientId: input.companyId,
      clientName: input.tenantSlug,
    });
    const storage = createFileStorage();
    const previousKey = await findPreviousAvatarKey(storage, ctx, input.userId);
    if (previousKey) await storage.delete(previousKey);
  } catch {
    // ignore
  }
}

/** Re-export for callers that need a quick way to fetch the company slug. */
export async function getCompanySlug(companyId: string): Promise<string | null> {
  const rows = await db
    .select({ tenantSlug: companies.tenantSlug })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  return rows[0]?.tenantSlug ?? null;
}
