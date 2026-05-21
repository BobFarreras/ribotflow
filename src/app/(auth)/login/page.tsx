/**
 * Creation/modification date: 21/05/2026
 * Path: src/app/(auth)/login/page.tsx
 * Description: Login page with email/password form connected to Server Action.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Lock, Mail } from "lucide-react";
import { loginAction } from "@/actions/auth/login";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction({
        email: formData.get("email"),
        password: formData.get("password"),
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
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
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            RIBOTFLOW
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Inicia sesión para continuar
          </p>
        </div>

        <form action={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-md border border-[var(--danger)]/30 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[var(--text)]"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isPending}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-2 pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                  placeholder="tu@empresa.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[var(--text)]"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-2 pl-10 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <p className="text-center text-sm text-[var(--text-muted)]">
            ¿No tienes cuenta?{" "}
            <a
              href="/register"
              className="font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              Regístrate
            </a>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
