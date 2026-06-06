/**
 * Creation/modification date: 06/06/2026
 * Path: src/services/sat/profile/types.ts
 * Description: DTOs for the user profile domain. A profile is a "view" of the
 *              user row restricted to the fields the user can see and edit
 *              about themselves (everything except role, status, and the
 *              tenant-internal id).
 */

export interface ProfileDto {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "TECHNICIAN" | "OFFICE";
  avatarUrl: string | null;
  companyId: string;
  companyName: string;
  companyLogoUrl: string | null;
}

export interface UpdateNameInput {
  userId: string;
  companyId: string;
  name: string;
}

export interface ChangePasswordInput {
  userId: string;
  companyId: string;
  currentPassword: string;
  newPassword: string;
}
