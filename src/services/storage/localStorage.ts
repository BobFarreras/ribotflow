/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/storage/localStorage.ts
 * Description: Local filesystem storage implementation for development.
 *              Files are stored under ./uploads and served via /api/uploads.
 */

import { mkdir, writeFile, unlink, access, constants } from "fs/promises";
import { join, dirname } from "path";
import type { FileStorage, UploadFileInput, UploadFileOutput } from "./interface";

export interface LocalStorageConfig {
  basePath: string;
  publicUrlPrefix: string;
}

export class LocalFileStorage implements FileStorage {
  private readonly basePath: string;
  private readonly publicUrlPrefix: string;

  constructor(config: LocalStorageConfig) {
    this.basePath = config.basePath;
    this.publicUrlPrefix = config.publicUrlPrefix.replace(/\/$/, "");
  }

  async upload(input: UploadFileInput): Promise<UploadFileOutput> {
    const filePath = join(this.basePath, input.storageKey);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, input.buffer);

    return {
      storageKey: input.storageKey,
      publicUrl: `${this.publicUrlPrefix}/${input.storageKey}`,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = join(this.basePath, storageKey);
    try {
      await unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  getPublicUrl(storageKey: string): string {
    return `${this.publicUrlPrefix}/${storageKey}`;
  }

  async exists(storageKey: string): Promise<boolean> {
    const filePath = join(this.basePath, storageKey);
    try {
      await access(filePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
