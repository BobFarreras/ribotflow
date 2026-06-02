/**
 * Creation/modification date: 01/06/2026
 * Path: src/components/sat/settings/useSmtpSettingsForm.ts
 * Description: Form state + handlers for the per-company SMTP config form.
 *              Kept separate from the JSX so the form component stays small.
 *              Exposes granular setters (single fields), patch helpers for
 *              grouped sub-forms (connection/sender), and preset application.
 */

"use client";

import { useState, useTransition } from "react";
import { updateSmtpConfigAction } from "@/actions/sat/company/updateSmtpConfig";
import { deleteSmtpConfigAction } from "@/actions/sat/company/deleteSmtpConfig";
import { testSmtpConnectionAction } from "@/actions/sat/company/testSmtpConnection";
import type { SmtpConfigDTO } from "./SmtpSettingsForm";
import type { SmtpPreset } from "./ProviderPresets";

export function useSmtpSettingsForm(initialConfig: SmtpConfigDTO | null) {
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
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

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

  function save(t: (k: string) => string, onSuccess: () => void) {
    startSave(async () => {
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
        onSuccess();
        setPassword("********");
      }
    });
  }

  function test() {
    setTestResult(null);
    startTest(async () => {
      const r = await testSmtpConnectionAction();
      setTestResult({ ok: r.success, msg: r.error ?? "" });
    });
  }

  function remove(t: (k: string) => string) {
    if (!window.confirm(t("actions.confirmDelete"))) return;
    startDelete(async () => {
      const r = await deleteSmtpConfigAction();
      if (r.success) reset();
    });
  }

  return {
    state: {
      host, port, user, password, secure, acceptSelfSigned, fromName, fromEmail,
      isSaving, isTesting, isDeleting, testResult,
    },
    setters: { setHost, setPort, setUser, setPassword, setSecure, setAcceptSelfSigned, setFromName, setFromEmail },
    actions: { save, test, remove },
    applyConnectionPatch,
    applySenderPatch,
    applyPreset,
  };
}
