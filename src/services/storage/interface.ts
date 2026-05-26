/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/storage/interface.ts
 * Description: Abstract file storage interface. Framework-agnostic contract
 *              for uploading, deleting and serving binary files.
 */

export interface UploadFileInput {
  buffer: Buffer;
  storageKey: string;
  mimeType: string;
  metadata?: Record<string, string>;
}

export interface UploadFileOutput {
  storageKey: string;
  publicUrl: string;
}

export interface FileStorage {
  upload(input: UploadFileInput): Promise<UploadFileOutput>;
  delete(storageKey: string): Promise<void>;
  getPublicUrl(storageKey: string): string;
  exists(storageKey: string): Promise<boolean>;
}
