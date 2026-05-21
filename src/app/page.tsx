/**
 * Data de creació/modificació: 21/05/2026
 * Ruta: src/app/page.tsx
 * Descripció: Pàgina arrel. Redirigeix al dashboard o login segons l'estat de sessió.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
