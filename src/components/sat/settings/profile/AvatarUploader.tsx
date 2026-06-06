/**
 * Creation/modification date: 06/06/2026
 * Path: src/components/sat/settings/profile/AvatarUploader.tsx
 * Description: Avatar upload widget. Drag-and-drop zone, preview, replace
 *              and remove actions. When the user has no avatar we show
 *              their initials inside a coloured circle.
 */

"use client";

import { useTranslations } from "next-intl";
import { Upload, Trash2, User as UserIcon, Loader2 } from "lucide-react";
import { useAvatarUpload } from "./useAvatarUpload";

interface Props {
  currentAvatarUrl: string | null;
  displayName: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Stable colour from a name (so the same user always gets the same tint). */
function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 60% 45%)`;
}

export function AvatarUploader({ currentAvatarUrl, displayName }: Props) {
  const t = useTranslations("sat.settings.profile");
  const av = useAvatarUpload({
    initialUrl: currentAvatarUrl,
    errorMessages: {
      unsupported: t("avatar.errors.unsupported"),
      tooLarge: t("avatar.errors.tooLarge"),
      empty: t("avatar.errors.empty"),
      uploadFailed: t("avatar.failed"),
      removeFailed: t("avatar.removeFailed"),
    },
    successMessages: {
      uploaded: t("avatar.success"),
      removed: t("avatar.removed"),
    },
  });

  const displayUrl = av.preview ?? av.url;
  const showInitials = !displayUrl && !av.isUploading;

  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="mb-3 flex items-start gap-2">
        <UserIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--info)]" aria-hidden />
        <div>
          <h4 className="text-sm font-semibold text-[color:var(--text)]">
            {t("avatar.title")}
          </h4>
          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
            {t("avatar.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-[6rem_1fr]">
        <div
          className={
            "relative flex aspect-square w-24 items-center justify-center overflow-hidden rounded-full border-2 " +
            (av.isDragging
              ? "border-dashed border-[color:var(--primary)] bg-[color:var(--primary)]/8"
              : "border-[color:var(--border)] bg-[color:var(--surface-2)]")
          }
          onDragOver={(e) => {
            e.preventDefault();
            if (!av.isUploading) av.setIsDragging(true);
          }}
          onDragLeave={() => av.setIsDragging(false)}
          onDrop={(e) => av.onDrop(e)}
        >
          {displayUrl ? (
            <img src={displayUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : showInitials ? (
            <span
              className="flex h-full w-full items-center justify-center text-xl font-semibold text-white"
              style={{ backgroundColor: tintFor(displayName) }}
            >
              {initials(displayName)}
            </span>
          ) : null}
          {av.isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--surface)]/80">
              <Loader2 className="h-6 w-6 animate-spin text-[color:var(--primary)]" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={av.inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={av.onInputChange}
            disabled={av.isUploading}
            className="hidden"
            aria-label={t("avatar.choose")}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => av.inputRef.current?.click()}
              disabled={av.isUploading}
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-hover)] disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {displayUrl ? t("avatar.replace") : t("avatar.choose")}
            </button>
            {displayUrl && (
              <button
                type="button"
                onClick={av.remove}
                disabled={av.isUploading}
                className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-sm font-medium text-[color:var(--danger)] transition-colors hover:bg-[color:var(--danger)]/10 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("avatar.remove")}
              </button>
            )}
          </div>
          <p className="text-xs text-[color:var(--text-muted)]">
            {t("avatar.formats")}
          </p>
        </div>
      </div>
    </div>
  );
}
