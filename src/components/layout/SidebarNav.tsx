/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/SidebarNav.tsx
 * Description: Navigation section. The nav tree is memoized and stable.
 *              Active selection is handled by a tiny ActiveIndicator component
 *              that only re-renders on route change — the rest of the sidebar
 *              stays completely still.
 */

"use client";

import { useState, useRef, useLayoutEffect, memo } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Wrench,
  Package,
  FileText,
  Users,
  Clock,
  Settings,
  ChevronRight,
  List,
  UserCircle,
  Tag,
  FolderOpen,
  Receipt,
  BarChart3,
  Fingerprint,
  Building2,
  Shield,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

/* ================================================================
   DATA
   ================================================================ */

interface SubItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubItem[];
}

const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    key: "sat",
    href: "/sat",
    icon: Wrench,
    subItems: [
      { key: "workOrders", href: "/sat", icon: List },
      { key: "clients", href: "/sat/clients", icon: UserCircle },
      { key: "categories", href: "/sat/categories", icon: Tag },
    ],
  },
  {
    key: "erp",
    href: "/erp",
    icon: Package,
    subItems: [
      { key: "products", href: "/erp/products", icon: FolderOpen },
      { key: "inventory", href: "/erp/inventory", icon: BarChart3 },
    ],
  },
  {
    key: "billing",
    href: "/billing",
    icon: FileText,
    subItems: [
      { key: "invoices", href: "/billing/invoices", icon: Receipt },
      { key: "budgets", href: "/billing/budgets", icon: FileText },
    ],
  },
  {
    key: "crm",
    href: "/crm",
    icon: Users,
    subItems: [
      { key: "contacts", href: "/crm/contacts", icon: UserCircle },
      { key: "opportunities", href: "/crm/opportunities", icon: BarChart3 },
    ],
  },
  {
    key: "access",
    href: "/access",
    icon: Clock,
    subItems: [
      { key: "timeTracking", href: "/access/time-tracking", icon: Fingerprint },
      { key: "absences", href: "/access/absences", icon: CalendarIcon },
    ],
  },
  {
    key: "settings",
    href: "/settings",
    icon: Settings,
    subItems: [
      { key: "company", href: "/settings/company", icon: Building2 },
      { key: "users", href: "/settings/users", icon: Shield },
      { key: "profile", href: "/settings/profile", icon: UserCircle },
    ],
  },
];

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/* ================================================================
   ACTIVE INDICATOR — the ONLY component that re-renders on route change
   Moves a small colored bar to highlight the active item
   ================================================================ */

function ActiveIndicator() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Find the most specific active link
    const links = Array.from(nav.querySelectorAll<HTMLElement>("[data-nav-target]"));
    let bestMatch: HTMLElement | null = null;
    let bestScore = -1;

    for (const link of links) {
      const href = link.getAttribute("data-nav-target") || "";
      if (pathname === href) {
        bestMatch = link;
        bestScore = Infinity;
        break;
      }
      if (pathname.startsWith(href + "/") && href.length > bestScore) {
        bestMatch = link;
        bestScore = href.length;
      }
    }

    if (bestMatch) {
      const rect = bestMatch.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      setIndicatorStyle({
        top: rect.top - navRect.top + nav.scrollTop,
        height: rect.height,
        opacity: 1,
      });
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [pathname]);

  return (
    <div
      ref={(el) => { if (el) navRef.current = el.closest("nav"); }}
      className="absolute left-0 w-1 rounded-r-full bg-[var(--primary)] pointer-events-none z-10"
      style={{
        top: indicatorStyle.top,
        height: indicatorStyle.height,
        opacity: indicatorStyle.opacity,
        transition: "top 150ms ease, height 150ms ease, opacity 150ms ease",
      }}
    />
  );
}

/* ================================================================
   COLLAPSED TOOLTIP
   ================================================================ */

function CollapsedTooltip({
  label,
  top,
}: {
  label: string;
  top: number;
}) {
  return (
    <div
      className="fixed z-[100] rounded-lg bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] shadow-lg border border-[var(--border)] whitespace-nowrap pointer-events-none"
      style={{ top, left: 80, transform: "translateY(-50%)" }}
    >
      {label}
    </div>
  );
}

/* ================================================================
   NAV ITEMS — memoized, never re-render on route change
   ================================================================ */

const CollapsedItem = memo(function CollapsedItem({ item }: { item: NavItem }) {
  const t = useTranslations("sidebar.modules");
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTop, setTooltipTop] = useState(0);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipTop(rect.top + rect.height / 2);
        setShowTooltip(true);
      }}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <a
        href={item.href}
        data-nav-target={item.href}
        className="flex items-center justify-center rounded-lg p-2.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      >
        <item.icon className="h-5 w-5" />
      </a>
      {showTooltip && <CollapsedTooltip label={t(`${item.key}.label`)} top={tooltipTop} />}
    </div>
  );
});

const ExpandedSubItem = memo(function ExpandedSubItem({
  item,
  parentKey,
}: {
  item: SubItem;
  parentKey: string;
}) {
  const t = useTranslations("sidebar.modules");

  return (
    <a
      href={item.href}
      data-nav-target={item.href}
      className="group flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{t(`${parentKey}.subItems.${item.key}`)}</span>
    </a>
  );
});

const ExpandedItem = memo(function ExpandedItem({ item }: { item: NavItem }) {
  const t = useTranslations("sidebar.modules");
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isLeafItem = !hasSubItems;

  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`sidebar:expanded:${item.key}`) === "true";
  });

  const handleToggle = () => {
    if (!hasSubItems) return;
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem(`sidebar:expanded:${item.key}`, String(next));
  };

  return (
    <div>
      {isLeafItem ? (
        <a
          href={item.href}
          data-nav-target={item.href}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left truncate">{t(`${item.key}.label`)}</span>
        </a>
      ) : (
        <button
          onClick={handleToggle}
          data-nav-target={item.href}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left truncate">{t(`${item.key}.label`)}</span>
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        </button>
      )}

      {hasSubItems && isExpanded && (
        <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-[var(--border)] pl-3">
          {item.subItems?.map((sub) => (
            <ExpandedSubItem key={sub.key} item={sub} parentKey={item.key} />
          ))}
        </div>
      )}
    </div>
  );
});

/* ================================================================
   EXPORT
   ================================================================ */

export default function SidebarNav() {
  const { isCollapsed } = useSidebar();

  return (
    <nav id="sidebar-nav" className="relative flex-1 overflow-y-auto px-3 py-4 space-y-1">
      <ActiveIndicator />
      {navItems.map((item) =>
        isCollapsed ? (
          <CollapsedItem key={item.key} item={item} />
        ) : (
          <ExpandedItem key={item.key} item={item} />
        )
      )}
    </nav>
  );
}
