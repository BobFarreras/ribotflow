/**
 * Creation/modification date: 25/05/2026
 * Path: src/components/layout/SidebarNav.tsx
 * Description: Navigation section of the sidebar with modules and sub-menus.
 */

"use client";

import { useState, useEffect } from "react";
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
  ChevronDown,
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

function NavSubItem({
  item,
  parentKey,
}: {
  item: SubItem;
  parentKey: string;
}) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const t = useTranslations("sidebar.modules");
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <a
      href={item.href}
      className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all ${
        isActive
          ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
          : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      }`}
      title={isCollapsed ? t(`${parentKey}.subItems.${item.key}`) : undefined}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{t(`${parentKey}.subItems.${item.key}`)}</span>
    </a>
  );
}

function NavItemComponent({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const t = useTranslations("sidebar.modules");
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const hasSubItems = item.subItems && item.subItems.length > 0;

  // Load expanded state from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(`sidebar:expanded:${item.key}`);
    if (saved === "true") setIsExpanded(true);
  }, [item.key]);

  // Auto-expand if active
  useEffect(() => {
    if (isActive && hasSubItems && !isExpanded) {
      setIsExpanded(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(`sidebar:expanded:${item.key}`, "true");
      }
    }
  }, [isActive, hasSubItems, item.key]);

  const handleToggle = () => {
    if (!hasSubItems) return;
    const next = !isExpanded;
    setIsExpanded(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(`sidebar:expanded:${item.key}`, String(next));
    }
  };

  if (isCollapsed) {
    return (
      <div className="relative group">
        <a
          href={item.href}
          className={`flex items-center justify-center rounded-lg p-2.5 transition-all ${
            isActive
              ? "bg-[var(--primary)]/10 text-[var(--primary)]"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          }`}
          title={t(`${item.key}.label`)}
        >
          <item.icon className="h-5 w-5" />
        </a>
        {/* Tooltip */}
        <div className="absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 rounded-md bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--text)] shadow-lg border border-[var(--border)] whitespace-nowrap group-hover:block">
          {t(`${item.key}.label`)}
          {hasSubItems && (
            <div className="mt-1 space-y-0.5 border-t border-[var(--border)] pt-1">
              {item.subItems?.map((sub) => (
                <a
                  key={sub.key}
                  href={sub.href}
                  className="block text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  {t(`${item.key}.subItems.${sub.key}`)}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={hasSubItems ? handleToggle : undefined}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
          isActive
            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
            : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
        } ${!hasSubItems ? "cursor-pointer" : ""}`}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left truncate">{t(`${item.key}.label`)}</span>
        {hasSubItems && (
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      {hasSubItems && isExpanded && (
        <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-[var(--border)] pl-3">
          {item.subItems?.map((sub) => (
            <NavSubItem key={sub.key} item={sub} parentKey={item.key} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SidebarNav() {
  const t = useTranslations("sidebar");

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {t("sections.main")}
      </div>
      {navItems.map((item) => (
        <NavItemComponent key={item.key} item={item} />
      ))}
    </nav>
  );
}
