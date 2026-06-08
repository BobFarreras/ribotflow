/**
 * Creation/modification date: 01/06/2026
 * Path: src/lib/utils/encryption.ts
 * Description: AES-256-GCM symmetric encryption used to protect secrets at rest
 *              (e.g. SMTP passwords stored in the smtp_configs table).
 *              Payload format: base64(iv):base64(authTag):base64(ciphertext).
 *              Key is read from process.env.ENCRYPTION_KEY (32 bytes base64).
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` " +
        "and add it to .env. Encrypted secrets become unrecoverable without it."
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (got ${key.length}). ` +
        "Generate a new one with `openssl rand -base64 32`."
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decrypt(payload: string): string {
  if (!isEncryptedPayload(payload)) {
    throw new Error("Encrypted payload is malformed: expected iv:tag:ct");
  }
  const key = getKey();
  const [ivB64, tagB64, ctB64] = payload.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ct = Buffer.from(ctB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

const BASE64_RE = /^[A-Za-z0-9+/]+=*$/;

export function isEncryptedPayload(value: string): boolean {
  if (!value) return false;
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0 && BASE64_RE.test(p));
}
