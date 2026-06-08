/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/CategoryIcon.tsx
 * Description: Reusable category SVG icon component. 10+ icon options.
 */

"use client";

export interface IconDef {
  path: string;
  label: string;
}

export const ICONS: Record<string, IconDef> = {
  repair: {
    label: "Reparació",
    path: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  },
  maintenance: {
    label: "Manteniment",
    path: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  },
  installation: {
    label: "Instal·lació",
    path: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  },
  assembly: {
    label: "Muntatge",
    path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  inspection: {
    label: "Inspecció",
    path: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  },
  cleaning: {
    label: "Neteja",
    path: "M3 6h18M3 12h18M3 18h18",
  },
  plumbing: {
    label: "Fontaneria",
    path: "M12 2v6m0 0v6m0-6h6m-6 0H6",
  },
  electrical: {
    label: "Electricitat",
    path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  },
  painting: {
    label: "Pintura",
    path: "M19 3l-5 5-5-5-5 5v14h20V8l-5-5z",
  },
  carpentry: {
    label: "Fusteria",
    path: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
  },
  gardening: {
    label: "Jardineria",
    path: "M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM12 22c-4.97 0-9-4.03-9-9 4.97 0 9 4.03 9 9z",
  },
  it: {
    label: "Informàtica",
    path: "M4 4h16v10H4zM12 18v4M8 22h8",
  },
  security: {
    label: "Seguretat",
    path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  },
};

interface Props {
  slug?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}

export function CategoryIcon({ slug, color, size = 16, className }: Props) {
  const icon = ICONS[slug ?? ""];
  if (!icon) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
    >
      {icon.path.split(" M").map((p, i) => (
        <path key={i} d={i === 0 ? p : `M${p}`} />
      ))}
    </svg>
  );
}
