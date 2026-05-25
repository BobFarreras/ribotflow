/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/SidebarFooter.tsx
 * Description: Footer section of the sidebar with theme toggle, language switcher, and user actions.
 */

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Moon, Sun, Globe, LogOut, ChevronLeft, ChevronRight, User } from "lucide-react";
import { logoutAction } from "@/actions/auth/logout";
import { useSidebar } from "./SidebarContext";

export default function SidebarFooter() {
  const { isCollapsed, toggleCollapse, theme, toggleTheme } = useSidebar();
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const next = locale === "ca" ? "es" : "ca";
    router.push(`/${next}${window.location.pathname.replace(/^\/(ca|es)/, "")}`);
    router.refresh();
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/login");
      router.refresh();
    });
  };

  if (isCollapsed) {
    return (
      <div className="border-t border-[var(--border)] p-2 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-center rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          title={theme === "light" ? t("actions.darkMode") : t("actions.lightMode")}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <button
          onClick={toggleLanguage}
          className="flex w-full items-center justify-center rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          title={t("actions.language")}
        >
          <Globe className="h-4 w-4" />
        </button>
        <button
          onClick={toggleCollapse}
          className="flex w-full items-center justify-center rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          title={t("actions.expand")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="flex w-full items-center justify-center rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-[var(--danger)] disabled:opacity-50"
          title={t("actions.logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border)] p-3 space-y-2">
      {/* Theme & Language */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === "light" ? t("actions.darkMode") : t("actions.lightMode")}
        </button>
        <button
          onClick={toggleLanguage}
          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        >
          <Globe className="h-4 w-4" />
          {locale.toUpperCase()}
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={toggleCollapse}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("actions.collapse")}
      </button>

      {/* Divider */}
      <div className="border-t border-[var(--border)]" />

      {/* User & Logout */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text)] truncate">{t("user.account")}</p>
          <p className="text-[10px] text-[var(--text-muted)] truncate">{t("user.manage")}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-red-50 hover:text-[var(--danger)] disabled:opacity-50"
          title={t("actions.logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
