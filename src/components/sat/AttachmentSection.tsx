/**
 * Creation/modification date: 26/05/2026
 * Path: src/components/sat/AttachmentSection.tsx
 * Description: Client component for uploading and displaying work order attachments.
 *              Supports photos with before/after labels, previews, and lightbox.
 */

"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { addAttachmentAction } from "@/actions/sat/addAttachment";
import { deleteAttachmentAction } from "@/actions/sat/deleteAttachment";
import type { WorkOrderAttachment } from "@/types/sat";
import { Upload, X, ImageIcon, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  attachments: WorkOrderAttachment[];
  workOrderId: string;
}

export function AttachmentSection({ attachments: initialAttachments, workOrderId }: Props) {
  const t = useTranslations("sat.attachments");
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isPending, startTransition] = useTransition();
  const [isBefore, setIsBefore] = useState(false);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Upload
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("workOrderId", workOrderId);
      formData.append("isBefore", String(isBefore));
      if (caption) formData.append("caption", caption);

      const result = await addAttachmentAction(formData);

      if (result.success && result.data) {
        setAttachments((prev) => [result.data, ...prev]);
        setPreviewUrl(null);
        setCaption("");
        setIsBefore(false);
      } else {
        setError(result.error || t("invalidType"));
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;

    startTransition(async () => {
      const result = await deleteAttachmentAction(id, workOrderId);
      if (result.success) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
      }
    });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const lightboxAttachment = lightboxIndex !== null ? attachments[lightboxIndex] : null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text)]">{t("title")}</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {t("uploadButton")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,application/pdf,audio/mpeg"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Upload options */}
      {previewUrl && (
        <div className="mb-3 space-y-2 rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <img src={previewUrl} alt={t("previewAlt")} className="h-full w-full object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-[var(--text)]">
              <input
                type="checkbox"
                checked={isBefore}
                onChange={(e) => setIsBefore(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[var(--border)]"
              />
              {t("beforeLabel")}
            </label>
            <input
              type="text"
              placeholder={t("captionPlaceholder")}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}

      {/* Grid */}
      {attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-[var(--text-muted)]">
          <ImageIcon className="mb-1 h-5 w-5 opacity-50" />
          <p className="text-xs">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {attachments.map((a, index) => (
            <div
              key={a.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg)]"
              onClick={() => openLightbox(index)}
            >
              {a.type === "photo" && a.url ? (
                <img
                  src={a.url}
                  alt={a.caption || a.fileName}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              {a.isBefore && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {t("beforeLabel")}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(a.id);
                }}
                disabled={isPending}
                className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxAttachment && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white"
            onClick={closeLightbox}
          >
            <X className="h-5 w-5" />
          </button>

          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {lightboxIndex < attachments.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div className="max-h-[80vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {lightboxAttachment.type === "photo" && lightboxAttachment.url ? (
              <img
                src={lightboxAttachment.url}
                alt={lightboxAttachment.caption || lightboxAttachment.fileName}
                className="max-h-[80vh] max-w-[90vw] object-contain"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--text)]">
                <ImageIcon className="h-12 w-12" />
              </div>
            )}
            {lightboxAttachment.caption && (
              <p className="mt-2 text-center text-sm text-white">{lightboxAttachment.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
