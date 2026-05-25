/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/SidebarNav.tsx
 * Description: Static navigation sidebar. The nav tree is rendered once and
 *              never re-rendered on route change. Active state is applied via
 *              a tiny ActiveHighlighter component that manipulates DOM classes.
 */

"use client";

import { useState, useLayoutEffect, useCallback } from "react";
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

interface SubItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
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
   ACTIVE HIGHLIGHTER — the ONLY component that re-renders on route change
   Updates DOM classes directly, sidebar tree never re-renders
   ================================================================ */

function ActiveHighlighter() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const nav = document.getElementById("sidebar-nav");
    if (!nav) return;

    // Remove all active classes
    nav.querySelectorAll("[data-nav-item]").forEach((el) => {
      el.classList.remove("bg-[var(--primary)]/10", "text-[var(--primary)]");
      el.classList.add("text-[var(--text-muted)]");
    });

    // Add active to matching items
    nav.querySelectorAll("[data-nav-item]").forEach((el) => {
      const href = el.getAttribute("data-href");
      if (!href) return;
      const isActive = pathname === href || pathname.startsWith(href + "/");
      if (isActive) {
        el.classList.remove("text-[var(--text-muted)]");
        el.classList.add("bg-[var(--primary)]/10", "text-[var(--primary)]");
      }
    });
  }, [pathname]);

  return null;
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
   COLLAPSED ITEM — simple icon + tooltip
   ================================================================ */

function CollapsedNavItem({ item }: { item: NavItem }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTop, setTooltipTop] = useState(0);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipTop(rect.top + rect.height / 2);
    setShowTooltip(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <a
        href={item.href}
        data-nav-item
        data-href={item.href}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-center justify-center rounded-lg p-2.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      >
        <item.icon className="h-5 w-5" />
      </a>
      {showTooltip && item.label && <CollapsedTooltip label={item.label} top={tooltipTop} />}
    </div>
  );
}

/* ================================================================
   EXPANDED SUB-ITEM — static, classes updated by ActiveHighlighter
   ================================================================ */

function ExpandedSubItem({
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
      data-nav-item
      data-href={item.href}
      className="group flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{t(`${parentKey}.subItems.${item.key}`)}</span>
    </a>
  );
}

/* ================================================================
   EXPANDED ITEM — static tree, classes updated by ActiveHighlighter
   ================================================================ */

function ExpandedNavItem({ item }: { item: NavItem }) {
  const t = useTranslations("sidebar.modules");
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isLeafItem = !hasSubItems;

  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`sidebar:expanded:${item.key}`) === "true";
  });

  const handleToggle = useCallback(() => {
    if (!hasSubItems) return;
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem(`sidebar:expanded:${item.key}`, String(next));
  }, [hasSubItems, isExpanded, item.key]);

  return (
    <div>
      {isLeafItem ? (
        <a
          href={item.href}
          data-nav-item
          data-href={item.href}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left truncate">{t(`${item.key}.label`)}</span>
        </a>
      ) : (
        <button
          onClick={handleToggle}
          data-nav-item
          data-href={item.href}
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
}

/* ================================================================
   EXPORT
   ================================================================ */

export default function SidebarNav() {
  const { isCollapsed } = useSidebar();
  const t = useTranslations("sidebar.modules");

  return (
    <>
      <ActiveHighlighter />
      <nav id="sidebar-nav" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) =>
          isCollapsed ? (
            <CollapsedNavItem key={item.key} item={{ ...item, label: t(`${item.key}.label`) }} />
          ) : (
            <ExpandedNavItem key={item.key} item={item} />
          )
        )}
      </nav>
    </>
  );
}
