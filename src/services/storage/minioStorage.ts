/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/storage/minioStorage.ts
 * Description: MinIO (S3-compatible) storage implementation for self-hosted deployments.
 */

import { Client as MinioClient } from "minio";
import type { FileStorage, UploadFileInput, UploadFileOutput } from "./interface";

export interface MinioStorageConfig {
  endPoint: string;
  port?: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  publicUrlBase?: string;
}

export class MinioStorage implements FileStorage {
  private client: MinioClient;
  private bucket: string;
  private publicUrlBase: string;

  constructor(config: MinioStorageConfig) {
    const { endPoint, port, useSSL, accessKey, secretKey, bucket, publicUrlBase } = config;
    this.client = new MinioClient({
      endPoint,
      port: port ?? (useSSL ? 443 : 80),
      useSSL,
      accessKey,
      secretKey,
    });
    this.bucket = bucket;
    this.publicUrlBase = publicUrlBase
      ? publicUrlBase.replace(/\/$/, "")
      : `${useSSL ? "https" : "http"}://${endPoint}:${port ?? 9000}/${bucket}`;
  }

  async upload(input: UploadFileInput): Promise<UploadFileOutput> {
    await this.client.putObject(this.bucket, input.storageKey, input.buffer, input.buffer.length, {
      "Content-Type": input.mimeType,
      ...input.metadata,
    });

    return {
      storageKey: input.storageKey,
      publicUrl: this.getPublicUrl(input.storageKey),
    };
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.removeObject(this.bucket, storageKey);
  }

  getPublicUrl(storageKey: string): string {
    return `${this.publicUrlBase}/${storageKey}`;
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, storageKey);
      return true;
    } catch (error) {
      if ((error as { code?: string }).code === "NotFound") {
        return false;
      }
      throw error;
    }
  }
}
