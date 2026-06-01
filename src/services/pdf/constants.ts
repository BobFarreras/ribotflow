/**
 * Creation/modification date: 01/06/2026
 * Path: src/services/pdf/constants.ts
 * Description: Design tokens and page constants for PDF generation.
 *              Pure data, zero logic. Colors match QuotePdfPreview.tsx.
 */

import { rgb } from "pdf-lib";

export const PAGE_W = 595.28; // A4 width (points)
export const PAGE_H = 841.89; // A4 height (points)
export const MARGIN = 48;
export const CONTENT_W = PAGE_W - MARGIN * 2;

export const COLORS = {
  // Legacy teal palette (work orders)
  primary: rgb(0.11, 0.63, 0.57),
  primaryLight: rgb(0.85, 0.96, 0.94),
  primaryDark: rgb(0.05, 0.42, 0.38),
  bgHeader: rgb(0.03, 0.27, 0.25),

  // Slate palette (quotes, matches QuotePdfPreview.tsx)
  slate900: rgb(0.118, 0.161, 0.231), // #1e293b
  slate700: rgb(0.2, 0.255, 0.333),    // #334155
  slate600: rgb(0.278, 0.333, 0.412),   // #475569
  slate500: rgb(0.392, 0.455, 0.545),  // #64748b
  slate400: rgb(0.58, 0.639, 0.722),   // #94a3b8
  slate200: rgb(0.886, 0.910, 0.941),  // #e2e8f0
  slate100: rgb(0.941, 0.953, 0.969),  // #f1f5f9
  slate50: rgb(0.973, 0.980, 0.988),   // #f8fafc

  // Accents
  blue500: rgb(0.231, 0.510, 0.965),   // #3b82f6
  green600: rgb(0.086, 0.392, 0.290),  // #16a34a

  // Commons
  text: rgb(0.11, 0.11, 0.11),
  textMuted: rgb(0.4, 0.4, 0.4),
  border: rgb(0.88, 0.88, 0.9),
  white: rgb(1, 1, 1),
} as const;
