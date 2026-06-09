/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/storage/factory.ts
 * Description: Factory to instantiate the correct FileStorage provider
 *              based on environment variables.
 */

import type { FileStorage } from "./interface";
import { LocalFileStorage } from "./localStorage";
import { MinioStorage } from "./minioStorage";
import { SupabaseStorage } from "./supabaseStorage";

export type StorageProvider = "local" | "minio" | "supabase";

function getProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER as StorageProvider | undefined;

  if (provider === "minio" || provider === "supabase" || provider === "local") {
    return provider;
  }

  const mode = process.env.NEXT_PUBLIC_APP_MODE;
  if (mode === "self_hosted") return "minio";
  if (mode === "cloud") return "supabase";
  return "local";
}

function fallbackToLocal(provider: string): LocalFileStorage {
  const isProduction = process.env.NODE_ENV === "production";
  const isBuild = process.env.npm_lifecycle_event === "build";
  if (isProduction && !isBuild) {
    throw new Error(
      `Missing environment variables for storage provider "${provider}". ` +
        "Check your production configuration."
    );
  }
  console.warn(
    `[Storage] Environment variables missing for provider "${provider}". ` +
      "Falling back to local filesystem storage."
  );
  const basePath = process.env.LOCAL_STORAGE_PATH ?? "./uploads";
  const publicUrlPrefix = process.env.LOCAL_STORAGE_URL_PREFIX ?? "/api/uploads";
  return new LocalFileStorage({ basePath, publicUrlPrefix });
}

export function createFileStorage(): FileStorage {
  const provider = getProvider();

  switch (provider) {
    case "minio": {
      const endPoint = process.env.MINIO_ENDPOINT;
      const accessKey = process.env.MINIO_ACCESS_KEY ?? process.env.MINIO_ROOT_USER;
      const secretKey = process.env.MINIO_SECRET_KEY ?? process.env.MINIO_ROOT_PASSWORD;
      const bucket = process.env.MINIO_BUCKET;

      if (!endPoint || !accessKey || !secretKey || !bucket) {
        return fallbackToLocal("minio");
      }

      const useSSL = process.env.MINIO_USE_SSL === "true";
      const port = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : undefined;
      const publicUrlBase = process.env.MINIO_PUBLIC_URL_BASE || undefined;

      return new MinioStorage({
        endPoint,
        port,
        useSSL,
        accessKey,
        secretKey,
        bucket,
        publicUrlBase,
      });
    }

    case "supabase": {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_KEY;
      const bucket = process.env.SUPABASE_BUCKET;

      if (!supabaseUrl || !serviceKey || !bucket) {
        return fallbackToLocal("supabase");
      }

      return new SupabaseStorage({ supabaseUrl, serviceKey, bucket });
    }

    case "local":
    default: {
      const basePath = process.env.LOCAL_STORAGE_PATH ?? "./uploads";
      const publicUrlPrefix = process.env.LOCAL_STORAGE_URL_PREFIX ?? "/api/uploads";
      return new LocalFileStorage({ basePath, publicUrlPrefix });
    }
  }
}
