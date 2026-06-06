/**
 * Creation/modification date: 06/06/2026
 * Path: src/actions/sat/team/listTeamMembers.ts
 * Description: Returns the team roster for the current company. Read access:
 *              any role with `team:read` (OWNER, ADMIN, OFFICE).
 */

"use server";

import { auth } from "@/lib/auth";
import { can } from "@/lib/auth/permissions";
import { teamService } from "@/services/sat/team";
import type { TeamMemberView } from "@/services/sat/team";

export interface ListTeamResult {
  members: TeamMemberView[];
}

export async function listTeamMembersAction(): Promise<ListTeamResult> {
  try {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.id) {
      return { members: [] };
    }
    if (!can(session.user.role, "team:read")) {
      return { members: [] };
    }

    const members = await teamService.listTeamMembers(session.user.companyId);
    const viewerId = session.user.id;

    const view: TeamMemberView[] = members.map((m) => ({
      ...m,
      isSelf: m.id === viewerId,
      isOwner: m.role === "OWNER",
    }));

    return { members: view };
  } catch {
    return { members: [] };
  }
}
