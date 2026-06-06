/**
 * Creation/modification date: 06/06/2026
 * Path: src/app/(dashboard)/settings/profile/page.tsx
 * Description: User profile page. Lets the signed-in user manage their
 *              own avatar, display name, password, UI theme and language.
 *              The user's role is shown read-only (it is changed from
 *              /settings/team by the OWNER). Sessions list is in
 *              commit 3 (TODO).
 */

import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserCircle, Building2, Shield } from "lucide-react";
import { getProfileAction } from "@/actions/sat/profile/getProfile";
import { getPreferencesAction } from "@/actions/sat/profile/getPreferences";
import { AvatarUploader } from "@/components/sat/settings/profile/AvatarUploader";
import { ProfileNameForm } from "@/components/sat/settings/profile/ProfileNameForm";
import { PasswordChangeForm } from "@/components/sat/settings/profile/PasswordChangeForm";
import { PreferencesForm } from "@/components/sat/settings/profile/PreferencesForm";
import { RoleBadge } from "@/components/sat/settings/team/RoleBadge";
import { SectionShell } from "@/components/sat/settings/SectionShell";
import { DEFAULT_PREFERENCES } from "@/services/sat/preferences/types";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.companyId) {
    redirect("/login");
  }

  const t = await getTranslations("sat.settings.profile");
  const tCompany = await getTranslations("sat.settings.company");
  const tTeam = await getTranslations("sat.settings.team");

  const [profileResult, prefsResult] = await Promise.all([
    getProfileAction(),
    getPreferencesAction(),
  ]);
  if (!profileResult.success || !profileResult.data) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-[color:var(--danger)]/40 bg-[color:var(--surface)] p-5 text-base text-[color:var(--danger)] shadow-sm">
          {t("errors.load")}
        </div>
      </div>
    );
  }
  const profile = profileResult.data;
  const prefs = prefsResult.success && prefsResult.data
    ? prefsResult.data
    : { theme: DEFAULT_PREFERENCES.theme, locale: DEFAULT_PREFERENCES.locale };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mx-auto mb-6 max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
              <UserCircle className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-[color:var(--text)]">
                {t("title")}
              </h1>
              <p className="text-sm text-[color:var(--text-muted)]">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={profile.role} size="sm" />
            {profile.role === "OWNER" && (
              <Link
                href="/settings/team"
                className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)]"
              >
                <Shield className="h-3.5 w-3.5" aria-hidden />
                {tTeam("title")}
              </Link>
            )}
            <Link
              href="/settings/company"
              className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)]"
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {tCompany("title")}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6">
        <SectionShell
          step={1}
          title={t("sections.avatar")}
          description={t("sections.avatarDesc")}
        >
          <AvatarUploader
            currentAvatarUrl={profile.avatarUrl}
            displayName={profile.name}
          />
        </SectionShell>

        <SectionShell
          step={2}
          title={t("sections.identity")}
          description={t("sections.identityDesc")}
        >
          <ProfileNameForm
            initialName={profile.name}
            initialEmail={profile.email}
          />
        </SectionShell>

        <SectionShell
          step={3}
          title={t("sections.security")}
          description={t("sections.securityDesc")}
        >
          <PasswordChangeForm />
        </SectionShell>

        <SectionShell
          step={4}
          title={t("sections.preferences")}
          description={t("sections.preferencesDesc")}
        >
          <PreferencesForm
            initialTheme={prefs.theme}
            initialLocale={prefs.locale}
          />
        </SectionShell>
      </div>
    </div>
  );
}
