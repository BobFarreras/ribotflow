/**
 * Creation/modification date: 24/05/2026
 * Path: src/app/(auth)/login/page.tsx
 * Description: Login page with email/password form connected to Server Action.
 */

import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
