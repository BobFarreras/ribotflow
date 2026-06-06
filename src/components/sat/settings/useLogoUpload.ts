/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/useLogoUpload.ts
 * Description: Drag-and-drop + upload logic for the company logo. Validates
 *              file mime + size, reads as base64, calls the server action,
 *              and exposes local preview + persisted URL state.
 */

"use client";

import { useState, useRef, useTransition } from "react";
import { toast } from "sonner";
import {
  uploadCompanyLogoAction,
  removeCompanyLogoAction,
} from "@/actions/sat/company/uploadCompanyLogo";

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export interface UseLogoUploadOptions {
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

export function useLogoUpload({
  initialUrl,
  errorMessages,
  successMessages,
}: UseLogoUploadOptions) {
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
        const r = await uploadCompanyLogoAction({
          fileName: file.name,
          mimeType: file.type,
          base64,
        });
        if (r.success && r.data?.logoUrl) {
          setUrl(r.data.logoUrl);
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
      const r = await removeCompanyLogoAction();
      if (r.success) {
        setUrl(null);
        setPreview(null);
        toast.success(successMessages.removed);
      } else {
        toast.error(`${errorMessages.removeFailed}: ${r.error ?? ""}`);
      }
    });
  }

  function onDrop(e: React.DragEvent, disabled: boolean) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
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
