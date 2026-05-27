/**
 * Creation/modification date: 27/05/2026
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
import { Upload, X, ImageIcon, Trash2, ChevronLeft, ChevronRight, Edit3 } from "lucide-react";

interface Props {
  attachments: WorkOrderAttachment[];
  workOrderId: string;
}

export function AttachmentSection({ attachments: initialAttachments, workOrderId }: Props) {
  const t = useTranslations("sat.attachments");
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState("");
  const [renameMode, setRenameMode] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPendingFile(file);
    setCustomFileName(file.name);
    setRenameMode(false);

    // Use FileReader for a robust data-url preview (works with all file types as fallback)
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again if cancelled
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = () => {
    if (!pendingFile) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("workOrderId", workOrderId);
      formData.append("isBefore", "false");
      if (customFileName.trim()) formData.append("fileName", customFileName.trim());

      const result = await addAttachmentAction(formData);

      if (result.success && result.data) {
        setAttachments((prev) => [result.data, ...prev]);
        setPreviewUrl(null);
        setPendingFile(null);
        setCustomFileName("");
        setRenameMode(false);
      } else {
        setError(result.error || t("invalidType"));
      }
    });
  };

  const handleCancelUpload = () => {
    setPreviewUrl(null);
    setPendingFile(null);
    setCustomFileName("");
    setRenameMode(false);
    setError(null);
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
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{t("title")}</h2>
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

      {/* Upload preview + file name */}
      {previewUrl && pendingFile && (
        <div className="mb-2 space-y-2 rounded-md border border-[var(--border)] bg-[var(--bg)] p-2">
          {/* Preview image */}
          <div className="relative w-full overflow-hidden rounded-md" style={{ aspectRatio: "16/9" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Vista prèvia"
              className="h-full w-full object-contain"
            />
          </div>

          {/* File name — editable */}
          <div className="flex items-center gap-2">
            {renameMode ? (
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setRenameMode(false)}
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                autoFocus
              />
            ) : (
              <span className="flex-1 truncate text-xs text-[var(--text-muted)]">
                {customFileName}
              </span>
            )}
            <button
              onClick={() => setRenameMode(!renameMode)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10"
            >
              <Edit3 className="h-3 w-3" />
              {renameMode ? "Desar" : "Canviar nom"}
            </button>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancelUpload}
              className="rounded-md px-2.5 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)]"
            >
              Cancel·lar
            </button>
            <button
              onClick={handleUpload}
              disabled={isPending}
              className="flex items-center gap-1 rounded-md bg-[var(--primary)] px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-[var(--primary)]/90 disabled:opacity-50"
            >
              <Upload className="h-3 w-3" />
              {isPending ? "Pujant..." : "Pujar"}
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {attachments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-[var(--text-muted)]">
          <ImageIcon className="mb-1 h-5 w-5 opacity-50" />
          <p className="text-xs">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
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
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
                  {t("beforeLabel")}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(a.id);
                }}
                disabled={isPending}
                className="absolute right-0.5 top-0.5 rounded bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
              >
                <Trash2 className="h-2.5 w-2.5" />
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
