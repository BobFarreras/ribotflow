/**
 * Creation/modification date: 21/05/2026
 * Path: src/lib/utils/cn.ts
 * Description: Utility for merging Tailwind CSS classes with clsx and tailwind-merge.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
