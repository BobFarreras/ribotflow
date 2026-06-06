/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/profile/useAvatarUpload.ts
 * Description: Drag-and-drop + upload logic for the user avatar. Same
 *              pattern as useLogoUpload but bound to the avatar actions
 *              and exposes the user's initials for the empty state.
 */

"use client";

import { useState, useRef, useTransition } from "react";
import { toast } from "sonner";
import {
  uploadAvatarAction,
  removeAvatarAction,
} from "@/actions/sat/profile/uploadAvatar";

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export interface UseAvatarUploadOptions {
  initialUrl: string | null;
  errorMessages: {
    unsupported: string;
    tooLarge: string;
    empty: string;
    uploadFailed: string;
    removeFailed: string;
  };
  successMessages: {
    uploaded: string;
    removed: string;
  };
}

export function useAvatarUpload({
  initialUrl,
  errorMessages,
  successMessages,
}: UseAvatarUploadOptions) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) return errorMessages.unsupported;
    if (file.size > MAX_SIZE) return errorMessages.tooLarge;
    if (file.size === 0) return errorMessages.empty;
    return null;
  }

  function handleFile(file: File) {
    const err = validate(file);
    if (err) {
      toast.error(err);
      return;
    }
    const fr = new FileReader();
    fr.onload = (e) => setPreview((e.target?.result as string) ?? null);
    fr.readAsDataURL(file);

    const base64Reader = new FileReader();
    base64Reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1] ?? "";
      startTransition(async () => {
        const r = await uploadAvatarAction({
          fileName: file.name,
          mimeType: file.type,
          base64,
        });
        if (r.success && r.data?.avatarUrl) {
          setUrl(r.data.avatarUrl);
          setPreview(null);
          toast.success(successMessages.uploaded);
        } else {
          setPreview(null);
          toast.error(`${errorMessages.uploadFailed}: ${r.error ?? ""}`);
        }
      });
    };
    base64Reader.readAsDataURL(file);
  }

  function remove() {
    startTransition(async () => {
      const r = await removeAvatarAction();
      if (r.success) {
        setUrl(null);
        setPreview(null);
        toast.success(successMessages.removed);
      } else {
        toast.error(`${errorMessages.removeFailed}: ${r.error ?? ""}`);
      }
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return {
    url,
    preview,
    isUploading,
    isDragging,
    setIsDragging,
    inputRef,
    handleFile,
    remove,
    onDrop,
    onInputChange,
  };
}
