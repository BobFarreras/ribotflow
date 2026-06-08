/**
 * Creation/modification date: 26/05/2026
 * Path: src/services/storage/supabaseStorage.ts
 * Description: Supabase Storage implementation for cloud (SaaS) deployments.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { FileStorage, UploadFileInput, UploadFileOutput } from "./interface";

export interface SupabaseStorageConfig {
  supabaseUrl: string;
  serviceKey: string;
  bucket: string;
}

export class SupabaseStorage implements FileStorage {
  private client: SupabaseClient;
  private bucket: string;

  constructor(config: SupabaseStorageConfig) {
    this.client = createClient(config.supabaseUrl, config.serviceKey);
    this.bucket = config.bucket;
  }

  async upload(input: UploadFileInput): Promise<UploadFileOutput> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(input.storageKey, input.buffer, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return {
      storageKey: input.storageKey,
      publicUrl: this.getPublicUrl(input.storageKey),
    };
  }

  async delete(storageKey: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([storageKey]);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  getPublicUrl(storageKey: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(storageKey);
    return data.publicUrl;
  }

  async exists(storageKey: string): Promise<boolean> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list("", { search: storageKey });

    if (error) {
      throw new Error(`Supabase list failed: ${error.message}`);
    }

    return data?.some((item) => item.name === storageKey) ?? false;
  }
}
