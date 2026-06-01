/**
 * Creation/modification date: 24/05/2026
 * Path: src/app/(auth)/register/page.tsx
 * Description: Registration page. Orchestrator: state, submit, layout.
 *              Form fields extracted to RegisterFormFields component.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "motion/react";
import { registerAction } from "@/actions/auth/register";
import { RegisterFormFields } from "./_components/RegisterFormFields";

export default function RegisterPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    if (password !== confirmPassword) {
      setError("Les contrasenyes no coincideixen");
      setIsPending(false);
      return;
    }
    const result = await registerAction({ companyName, name, email, password, confirmPassword });
    if (!result.success) {
      setError(result.error ?? "Error en el registre");
      setIsPending(false);
      return;
    }
    const signInResult = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/dashboard" });
    setIsPending(false);
    if (signInResult?.error) {
      setError("Registre completat però error en iniciar sessió. Torna a provar.");
    } else if (signInResult?.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--text)]">RIBOTFLOW</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Crea tu cuenta para empezar</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}
          <RegisterFormFields
            companyName={companyName} name={name} email={email} password={password} confirmPassword={confirmPassword}
            onCompanyNameChange={setCompanyName} onNameChange={setName} onEmailChange={setEmail}
            onPasswordChange={setPassword} onConfirmPasswordChange={setConfirmPassword} disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          <p className="text-center text-sm text-[var(--text-muted)]">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]">
              Inicia sesión
            </a>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
