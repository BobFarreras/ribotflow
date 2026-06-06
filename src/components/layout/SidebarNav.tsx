/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/SidebarNav.tsx
 * Description: Navigation tree. Each item computes its own active state from
 *              the current pathname. Sub-menus are always in the DOM (hidden/block)
 *              so they never unmount and lose their scroll/expand state.
 */

"use client";

import { useState, useRef, memo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
  Map,
  Route,
  Mail,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { requiredPermissionFor } from "@/lib/auth/canSeePath";
import { can } from "@/lib/auth/permissions";
import type { Permission } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/roles";

/* ================================================================
   DATA
   ================================================================ */

interface SubItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Permission required to see this sub-item. If absent, derives from the
   *  href via canSeePath (any signed-in user passes). */
  permission?: Permission;
}

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Permission required to see this item. Defaults to "any signed-in
   *  user can see" unless href is gated in canSeePath. */
  permission?: Permission;
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
      { key: "quotes", href: "/sat/quotes", icon: FileText, permission: "quote:read" },
      { key: "quoteTemplates", href: "/sat/quotes/templates", icon: FolderOpen, permission: "quote:read" },
      { key: "map", href: "/sat/map", icon: Map, permission: "route:read" },
      { key: "routes", href: "/sat/routes", icon: Route, permission: "route:read" },
      { key: "clients", href: "/sat/clients", icon: UserCircle, permission: "client:read" },
      { key: "categories", href: "/sat/categories", icon: Tag, permission: "material:read" },
    ],
  },
  {
    key: "erp",
    href: "/erp",
    icon: Package,
    permission: "material:read",
    subItems: [
      { key: "products", href: "/erp/products", icon: FolderOpen },
      { key: "inventory", href: "/erp/inventory", icon: BarChart3 },
    ],
  },
  {
    key: "billing",
    href: "/billing",
    icon: FileText,
    permission: "invoice:read",
    subItems: [
      { key: "invoices", href: "/billing/invoices", icon: Receipt },
      { key: "budgets", href: "/billing/budgets", icon: FileText },
    ],
  },
  {
    key: "crm",
    href: "/crm",
    icon: Users,
    permission: "client:read",
    subItems: [
      { key: "contacts", href: "/crm/contacts", icon: UserCircle },
      { key: "opportunities", href: "/crm/opportunities", icon: BarChart3 },
    ],
  },
  {
    key: "access",
    href: "/access",
    icon: Clock,
    permission: "workorder:read:own",
    subItems: [
      { key: "timeTracking", href: "/access/time-tracking", icon: Fingerprint },
      { key: "absences", href: "/access/absences", icon: CalendarIcon },
    ],
  },
  {
    key: "settings",
    href: "/settings",
    icon: Settings,
    permission: "company:read",
    subItems: [
      { key: "company", href: "/settings/company", icon: Building2 },
      { key: "email", href: "/settings/email", icon: Mail, permission: "email:read" },
      { key: "team", href: "/settings/team", icon: Shield, permission: "team:read" },
      { key: "profile", href: "/settings/profile", icon: UserCircle, permission: "profile:read:self" },
    ],
  },
];

/** Resolves the permission required to see an item (explicit > derived). */
function permissionFor(item: { href: string; permission?: Permission }): Permission | null {
  if (item.permission) return item.permission;
  return requiredPermissionFor(item.href);
}

function canSee(role: Role | null, perm: Permission | null): boolean {
  if (perm === null) return true; // public
  if (role === null) return false; // not signed in - hide
  return can(role, perm);
}

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

function isParentActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.href !== "/" && pathname.startsWith(item.href + "/")) return true;
  return false;
}

function isChildActive(pathname: string, href: string): boolean {
  return pathname === href;
}

/* ================================================================
   COLLAPSED TOOLTIP / PANEL
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

function CollapsedSubMenuPanel({
  item,
  pathname,
  top,
}: {
  item: NavItem;
  pathname: string;
  top: number;
}) {
  const t = useTranslations("sidebar.modules");
  if (!item.subItems || item.subItems.length === 0) return null;

  return (
    <div
      className="fixed z-[100] rounded-lg bg-[var(--surface)] shadow-lg border border-[var(--border)] py-2 min-w-[180px]"
      style={{ top: top - 8, left: 80 }}
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] border-b border-[var(--border)] mb-1">
        {t(`${item.key}.label`)}
      </div>
      {item.subItems.map((sub) => {
        const subActive = isChildActive(pathname, sub.href);
        return (
          <Link
            key={sub.key}
            href={sub.href}
            data-nav-target={sub.href}
            className={`flex items-center gap-2 px-3 py-2 text-sm mx-1 rounded-md ${
              subActive
                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                : "text-[var(--text)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <sub.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{t(`${item.key}.subItems.${sub.key}`)}</span>
          </Link>
        );
      })}
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
  const active = isParentActive(pathname, item);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = (e: React.MouseEvent) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipTop(rect.top + rect.height / 2);
    setShowTooltip(true);
  };

  const handleLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 150);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href={item.href}
        data-nav-target={item.href}
        className={`flex items-center justify-center rounded-lg p-2.5 ${
          active
            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
            : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        }`}
      >
        <item.icon className="h-5 w-5" />
      </Link>
      {showTooltip && hasSubItems && (
        <div onMouseEnter={() => leaveTimeoutRef.current && clearTimeout(leaveTimeoutRef.current)} onMouseLeave={handleLeave}>
          <CollapsedSubMenuPanel item={item} pathname={pathname} top={tooltipTop} />
        </div>
      )}
      {showTooltip && !hasSubItems && (
        <CollapsedTooltip label={t(`${item.key}.label`)} top={tooltipTop} />
      )}
    </div>
  );
}

/* ================================================================
   EXPANDED ITEM
   ================================================================ */

function ExpandedNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const t = useTranslations("sidebar.modules");
  const { expandedKeys, toggleExpanded } = useSidebar();
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isLeaf = !hasSubItems;
  const isActive = isParentActive(pathname, item);
  const hasActiveChild = item.subItems?.some((sub) => isChildActive(pathname, sub.href)) ?? false;

  // Global expanded state from context — survives navigation re-renders
  const isExpanded = expandedKeys.has(item.key);

  const handleToggle = () => {
    if (!hasSubItems) return;
    toggleExpanded(item.key);
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
        <Link
          href={item.href}
          data-nav-target={item.href}
          className={`${baseItemClasses} ${parentClasses}`}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 text-left truncate">{t(`${item.key}.label`)}</span>
        </Link>
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
            const subActive = isChildActive(pathname, sub.href);
            return (
              <Link
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
              </Link>
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

export default function SidebarNav({ userRole }: { userRole?: Role | null } = {}) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  // userRole semantics:
  //   undefined -> not specified (tests / SSR fallback): show every item
  //   null      -> signed-out: hide every gated item
  //   "OWNER"   -> filter by the matrix
  //
  // Visibility rule:
  //   - If the item has sub-items: show the parent when at least one child
  //     is visible. The parent's own permission is ignored (it is just a
  //     module grouping). This is what lets OFFICE see the SAT module
  //     (it has workorder:read:all but not workorder:read:own).
  //   - Leaf items: gate by item.permission, or derive from href via
  //     canSeePath.
  const visibleItems =
    userRole === undefined
      ? navItems
      : navItems
          .map((item) => {
            const hasSubItems = !!item.subItems && item.subItems.length > 0;
            if (!hasSubItems) {
              const leafPerm = permissionFor(item);
              return canSee(userRole, leafPerm) ? item : null;
            }
            const visibleSubs = item.subItems!.filter((sub) =>
              canSee(userRole, permissionFor(sub))
            );
            if (visibleSubs.length === 0) return null;
            return { ...item, subItems: visibleSubs };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {visibleItems.map((item) =>
        isCollapsed ? (
          <CollapsedNavItem key={item.key} item={item} pathname={pathname} />
        ) : (
          <ExpandedNavItem key={item.key} item={item} pathname={pathname} />
        )
      )}
    </nav>
  );
}
