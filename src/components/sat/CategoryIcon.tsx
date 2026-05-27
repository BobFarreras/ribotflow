/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/CategoryIcon.tsx
 * Description: Reusable category SVG icon component. Matches map markers.
 */

"use client";

const ICONS: Record<string, { path: string; viewBox?: string }> = {
  repair: {
    path: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  },
  maintenance: {
    path: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  },
  installation: {
    path: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  },
  assembly: {
    path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  inspection: {
    path: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  },
};

interface Props {
  slug?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}

export function CategoryIcon({ slug, color, size = 16, className }: Props) {
  const icon = ICONS[slug ?? ""] || ICONS.maintenance;

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
