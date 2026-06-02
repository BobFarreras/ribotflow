/**
 * Creation/modification date: 02/06/2026
 * Path: src/components/sat/settings/useSmtpSettingsForm.ts
 * Description: Form state + handlers for the per-company SMTP config form.
 *              Handles save (with success/error feedback), test connection,
 *              delete, and preset application. Uses server actions directly.
 *              After save/delete, calls router.refresh() so the Server Component
 *              re-fetches and the form props update (enables test button, etc.).
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateSmtpConfigAction } from "@/actions/sat/company/updateSmtpConfig";
import { deleteSmtpConfigAction } from "@/actions/sat/company/deleteSmtpConfig";
import { testSmtpConnectionAction } from "@/actions/sat/company/testSmtpConnection";
import type { SmtpConfigDTO } from "./SmtpSettingsForm";
import type { SmtpPreset } from "./ProviderPresets";
import type { TestResult } from "./SmtpTestBanner";

export type SaveStatus = "idle" | "saving" | "success" | "error";

export function useSmtpSettingsForm(initialConfig: SmtpConfigDTO | null) {
  const t = useTranslations("sat.settings.email");
  const router = useRouter();

  const [host, setHost] = useState(initialConfig?.host ?? "");
  const [port, setPort] = useState(initialConfig?.port ?? 587);
  const [user, setUser] = useState(initialConfig?.user ?? "");
  const [password, setPassword] = useState(initialConfig?.password ?? "");
  const [secure, setSecure] = useState(initialConfig?.secure ?? false);
  const [acceptSelfSigned, setAcceptSelfSigned] = useState(
    initialConfig?.acceptSelfSigned ?? false
  );
  const [fromName, setFromName] = useState(initialConfig?.fromName ?? "");
  const [fromEmail, setFromEmail] = useState(initialConfig?.fromEmail ?? "");

  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasConfig, setHasConfig] = useState(!!initialConfig);

  function applyConnectionPatch(patch: Partial<{
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
  }>) {
    if (patch.host !== undefined) setHost(patch.host);
    if (patch.port !== undefined) setPort(patch.port);
    if (patch.user !== undefined) setUser(patch.user);
    if (patch.password !== undefined) setPassword(patch.password);
    if (patch.secure !== undefined) setSecure(patch.secure);
  }

  function applySenderPatch(patch: Partial<{ fromName: string; fromEmail: string }>) {
    if (patch.fromName !== undefined) setFromName(patch.fromName);
    if (patch.fromEmail !== undefined) setFromEmail(patch.fromEmail);
  }

  function applyPreset(preset: SmtpPreset) {
    setHost(preset.host);
    setPort(preset.port);
    setSecure(preset.secure);
  }

  function reset() {
    setHost("");
    setPort(587);
    setUser("");
    setPassword("");
    setSecure(false);
    setAcceptSelfSigned(false);
    setFromName("");
    setFromEmail("");
    setTestResult(null);
  }

  async function save() {
    setSaveStatus("saving");
    setSaveError(null);
    startSave(async () => {
      try {
        const r = await updateSmtpConfigAction({
          host,
          port,
          user,
          password,
          secure,
          acceptSelfSigned,
          fromName: fromName || null,
          fromEmail: fromEmail || null,
        });
        if (r.success) {
          setSaveStatus("success");
          setHasConfig(true);
          setPassword("********");
          setTimeout(() => setSaveStatus("idle"), 3000);
          router.refresh();
        } else {
          setSaveStatus("error");
          setSaveError(r.error ?? t("errors.save"));
        }
      } catch {
        setSaveStatus("error");
        setSaveError(t("errors.save"));
      }
    });
  }

  async function test() {
    setTestResult(null);
    startTest(async () => {
      try {
        const r = await testSmtpConnectionAction();
        setTestResult({ success: r.success, error: r.error ?? null });
      } catch {
        setTestResult({ success: false, error: t("errors.test") });
      }
    });
  }

  async function remove() {
    if (!window.confirm(t("actions.confirmDelete"))) return;
    startDelete(async () => {
      try {
        const r = await deleteSmtpConfigAction();
        if (r.success) {
          setHasConfig(false);
          reset();
          router.refresh();
        }
      } catch {
        // silently fail — user can try again
      }
    });
  }

  return {
    state: {
      host, port, user, password, secure, acceptSelfSigned, fromName, fromEmail,
      isSaving, isTesting, isDeleting, testResult, saveStatus, saveError, hasConfig,
    },
    setters: { setHost, setPort, setUser, setPassword, setSecure, setAcceptSelfSigned, setFromName, setFromEmail },
    actions: { save, test, remove },
    applyConnectionPatch,
    applySenderPatch,
    applyPreset,
  };
}