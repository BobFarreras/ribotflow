/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/SmtpSettingsForm.tsx
 * Description: SMTP settings form orchestrator. Composes all sections,
 *              RBAC logic, and action buttons. Shows save/test feedback inline.
 */

"use client";

import { useTranslations } from "next-intl";
import { Save, Trash2, Plug, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { SmtpStatusBadge } from "./SmtpStatusBadge";
import { ProviderPresets, type SmtpPreset } from "./ProviderPresets";
import { SmtpTestBanner } from "./SmtpTestBanner";
import { SmtpPermissionNotice } from "./SmtpPermissionNotice";
import { SmtpConnectionFields } from "./SmtpConnectionFields";
import { SmtpSenderFields } from "./SmtpSenderFields";
import { SmtpAdvancedSection } from "./SmtpAdvancedSection";
import { useSmtpSettingsForm, type SaveStatus } from "./useSmtpSettingsForm";

export interface SmtpConfigDTO {
  id: string;
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  acceptSelfSigned: boolean;
  fromName: string | null;
  fromEmail: string | null;
  updatedAt: Date | string;
}

interface Props {
  initialConfig: SmtpConfigDTO | null;
  userRole: "OWNER" | "ADMIN" | "TECHNICIAN" | "OFFICE";
}

function SaveFeedback({ status, error }: { status: SaveStatus; error: string | null }) {
  const t = useTranslations("sat.settings.email.feedback");

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-[color:var(--text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t("saving")}
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--success)]">
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        {t("saved")}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--danger)]">
        <AlertCircle className="h-4 w-4" aria-hidden />
        {error ?? t("saveError")}
      </span>
    );
  }
  return null;
}

export function SmtpSettingsForm({ initialConfig, userRole }: Props) {
  const t = useTranslations("sat.settings.email");
  const isOwner = userRole === "OWNER";
  const canEdit = isOwner;
  const canTest = isOwner || userRole === "ADMIN";

  const {
    state: { host, port, user, password, secure, acceptSelfSigned, fromName, fromEmail, isSaving, isTesting, isDeleting, testResult, saveStatus, saveError, hasConfig },
    setters: { setAcceptSelfSigned },
    actions: { save, test, remove },
    applyConnectionPatch,
    applySenderPatch,
    applyPreset,
  } = useSmtpSettingsForm(initialConfig);

  function handlePreset(preset: SmtpPreset) {
    applyPreset(preset);
  }

  return (
    <div className="space-y-6">
      <SmtpStatusBadge configured={!!initialConfig} lastUpdated={initialConfig?.updatedAt} />

      {!canEdit && <SmtpPermissionNotice role={userRole} />}

      {canEdit && <ProviderPresets onSelect={handlePreset} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canEdit) return;
          save();
        }}
        className="space-y-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-sm)]"
      >
        <fieldset disabled={!canEdit} className="space-y-8">
          <SmtpConnectionFields
            state={{ host, port, user, password, secure }}
            disabled={!canEdit}
            hasExistingConfig={!!initialConfig}
            onChange={applyConnectionPatch}
          />

          <SmtpSenderFields
            state={{ fromName: fromName ?? "", fromEmail: fromEmail ?? "" }}
            disabled={!canEdit}
            onChange={applySenderPatch}
          />

          <SmtpAdvancedSection
            acceptSelfSigned={acceptSelfSigned}
            disabled={!canEdit}
            onChange={setAcceptSelfSigned}
          />
        </fieldset>

        <SmtpTestBanner result={testResult} />

        <div className="flex flex-wrap items-center gap-3 border-t border-[color:var(--border)] pt-4">
          {canEdit && (
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              {isSaving ? t("actions.saving") : t("actions.save")}
            </button>
          )}

          {canTest && (
            <button
              type="button"
              onClick={() => test()}
              disabled={isTesting || !hasConfig}
              className="btn btn-secondary"
            >
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plug className="h-4 w-4" aria-hidden />}
              {isTesting ? t("actions.testing") : t("actions.test")}
            </button>
          )}

          <SaveFeedback status={saveStatus} error={saveError} />

          {canEdit && initialConfig && (
            <button
              type="button"
              onClick={() => remove()}
              disabled={isDeleting}
              className="btn btn-ghost ml-auto"
              style={{ color: "var(--danger)" }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t("actions.delete")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}