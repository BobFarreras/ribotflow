/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/CompanyLogoUploader.tsx
 * Description: Presentational logo uploader. Drag-and-drop zone, preview,
 *              upload / replace / remove actions. Logic lives in
 *              useLogoUpload (separate file).
 */

"use client";

import { useTranslations } from "next-intl";
import { Upload, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { useLogoUpload } from "./useLogoUpload";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

interface Props {
  currentLogoUrl: string | null;
  disabled: boolean;
}

export function CompanyLogoUploader({ currentLogoUrl, disabled }: Props) {
  const t = useTranslations("sat.settings.company");
  const logo = useLogoUpload({
    initialUrl: currentLogoUrl,
    errorMessages: {
      unsupported: t("logoUpload.errors.unsupported"),
      tooLarge: t("logoUpload.errors.tooLarge"),
      empty: t("logoUpload.errors.empty"),
      uploadFailed: t("logoUpload.failed"),
      removeFailed: t("logoUpload.removeFailed"),
    },
    successMessages: {
      uploaded: t("logoUpload.success"),
      removed: t("logoUpload.removed"),
    },
  });

  const displayUrl = logo.preview ?? logo.url;
  const showDropZone = !displayUrl && !logo.isUploading;

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-start gap-2">
        <ImageIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--info)]" aria-hidden />
        <div>
          <h4 className="text-sm font-semibold text-[color:var(--text)]">
            {t("logoUpload.title")}
          </h4>
          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
            {t("logoUpload.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-[8rem_1fr]">
        <div
          className={
            "relative flex aspect-square w-32 items-center justify-center overflow-hidden rounded-md border-2 " +
            (logo.isDragging
              ? "border-dashed border-[color:var(--primary)] bg-[color:var(--primary)]/8"
              : "border-border bg-[color:var(--surface-hover)]")
          }
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !logo.isUploading) logo.setIsDragging(true);
          }}
          onDragLeave={() => logo.setIsDragging(false)}
          onDrop={(e) => logo.onDrop(e, disabled)}
        >
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-8 w-8 text-[color:var(--text-muted)]" aria-hidden />
          )}
          {logo.isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--surface)]/80">
              <Loader2 className="h-6 w-6 animate-spin text-[color:var(--primary)]" aria-hidden />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={logo.inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            onChange={logo.onInputChange}
            disabled={disabled || logo.isUploading}
            className="sr-only"
            id={showDropZone ? "company-logo-input" : "company-logo-input-replace"}
          />
          <label htmlFor={showDropZone ? "company-logo-input" : "company-logo-input-replace"} className="btn btn-secondary btn-sm">
            <Upload className="h-4 w-4" aria-hidden />
            {showDropZone ? t("logoUpload.choose") : t("logoUpload.replace")}
          </label>
          {!showDropZone && logo.url && !logo.preview && !disabled && (
            <button
              type="button"
              onClick={logo.remove}
              disabled={logo.isUploading}
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--danger)" }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t("logoUpload.remove")}
            </button>
          )}
          {showDropZone ? (
            <p className="text-xs text-[color:var(--text-muted)]">{t("logoUpload.dragHint")}</p>
          ) : (
            <p className="text-xs text-[color:var(--text-muted)]">{t("logoUpload.formats")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
