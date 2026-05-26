/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/SidebarNav.tsx
 * Description: Navigation tree. Each item computes its own active state from
 *              the current pathname. Sub-menus are always in the DOM (hidden/block)
 *              so they never unmount and lose their scroll/expand state.
 */

"use client";

import { useState } from "react";
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
   HELPERS
   ================================================================ */

function isLinkActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(href + "/")) return true;
  return false;
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
   COLLAPSED ITEM
   ================================================================ */

function CollapsedNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const t = useTranslations("sidebar.modules");
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTop, setTooltipTop] = useState(0);
  const active = isLinkActive(pathname, item.href);

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
        className={`flex items-center justify-center rounded-lg p-2.5 ${
          active
            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
            : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        }`}
      >
        <item.icon className="h-5 w-5" />
      </a>
      {showTooltip && <CollapsedTooltip label={t(`${item.key}.label`)} top={tooltipTop} />}
    </div>
  );
}

/* ================================================================
   EXPANDED ITEM
   ================================================================ */

function ExpandedNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const t = useTranslations("sidebar.modules");
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isLeaf = !hasSubItems;
  const isActive = isLinkActive(pathname, item.href);
  const hasActiveChild = item.subItems?.some((sub) => isLinkActive(pathname, sub.href)) ?? false;

  // Expanded state: initialize from localStorage, persist on toggle
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

  const baseItemClasses =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium";

  const activeItemClasses = "bg-[var(--primary)]/10 text-[var(--primary)]";
  const inactiveItemClasses =
    "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]";

  const parentClasses = isActive || hasActiveChild ? activeItemClasses : inactiveItemClasses;

  return (
    <div>
      {isLeaf ? (
        <a
          href={item.href}
          data-nav-target={item.href}
          className={`${baseItemClasses} ${parentClasses}`}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left truncate">{t(`${item.key}.label`)}</span>
        </a>
      ) : (
        <button
          onClick={handleToggle}
          data-nav-target={item.href}
          className={`${baseItemClasses} ${parentClasses}`}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left truncate">{t(`${item.key}.label`)}</span>
          <ChevronRight
            className={`h-4 w-4 shrink-0 ${isExpanded ? "rotate-90" : ""}`}
          />
        </button>
      )}

      {/* Sub-menu: ALWAYS in the DOM, visibility controlled by hidden/block */}
      {hasSubItems && (
        <div
          className={`mt-1 ml-4 space-y-0.5 border-l-2 border-[var(--border)] pl-3 ${
            isExpanded ? "block" : "hidden"
          }`}
        >
          {item.subItems!.map((sub) => {
            const subActive = isLinkActive(pathname, sub.href);
            return (
              <a
                key={sub.key}
                href={sub.href}
                data-nav-target={sub.href}
                className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  subActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                }`}
              >
                <sub.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {t(`${item.key}.subItems.${sub.key}`)}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   EXPORT
   ================================================================ */

export default function SidebarNav() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {navItems.map((item) =>
        isCollapsed ? (
          <CollapsedNavItem key={item.key} item={item} pathname={pathname} />
        ) : (
          <ExpandedNavItem key={item.key} item={item} pathname={pathname} />
        )
      )}
    </nav>
  );
}
