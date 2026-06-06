/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(auth)/register/_lib/passwordStrength.ts
 * Description: Pure function that scores a password from 0 (very weak) to 4
 *              (excellent) and returns a label and a Tailwind color class.
 */

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const LABELS = ["Molt feble", "Feble", "Mitjana", "Bona", "Excel·lent"];
const COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-green-600"];

export function passwordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return { score, label: LABELS[score], color: COLORS[score] };
}
