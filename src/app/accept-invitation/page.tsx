/**
 * Creation/modification date: 06/06/2026
 * Path: src/app/accept-invitation/page.tsx
 * Description: Public landing page for invitation acceptance. The
 *              signed-out user lands here after clicking the link in
 *              the invitation email. The page validates the token
 *              on the server and either shows the password form or
 *              an error message.
 */

import { getTranslations } from "next-intl/server";
import { teamService } from "@/services/sat/team";
import { AcceptInvitationForm } from "@/components/sat/auth/AcceptInvitationForm";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Accepta la invitació · RIBOTFLOW",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitationPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const t = await getTranslations("sat.acceptInvitation");

  if (!token) {
    return <ErrorState message={t("errors.missingToken")} />;
  }

  // Validate the token without consuming it. If it's invalid, show
  // an error. The actual update happens in the Server Action only
  // after the user submits a valid password.
  let invited: { name: string; email: string; companyName: string } | null = null;
  let validationError: string | null = null;
  try {
    const member = await teamService.acceptInvitationToken(token);
    invited = { name: member.name, email: member.email, companyName: "" };
  } catch {
    validationError = t("errors.invalidToken");
  }

  return (
    <div className="min-h-screen bg-[color:var(--surface-2)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--primary)]/12 text-[color:var(--primary)]">
          <Sparkles className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-[color:var(--text)]">
          {t("title")}
        </h1>
        <p className="mb-6 text-center text-sm text-[color:var(--text-muted)]">
          {t("subtitle")}
        </p>

        <div className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
          {validationError ? (
            <ErrorState message={validationError} />
          ) : invited ? (
            <AcceptInvitationForm
              token={token}
              invitedEmail={invited.email}
              invitedName={invited.name}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/5 px-3 py-2 text-sm text-[color:var(--danger)]">
      {message}
    </p>
  );
}
