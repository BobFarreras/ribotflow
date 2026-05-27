/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderFilters.tsx
 * Description: Compact single-row filter bar. All controls on one line.
 */

"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  LayoutGrid,
  Table2,
  Columns3,
  X,
  ChevronDown,
  Calendar,
  User,
  SlidersHorizontal,
} from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface TechnicianOption {
  id: string;
  name: string;
}

interface Props {
  categories: CategoryOption[];
  technicians: TechnicianOption[];
}

const STATUS_OPTIONS = [
  { key: "pending", label: "Pendent", color: "#ca8a04" },
  { key: "assigned", label: "Assignada", color: "#3b82f6" },
  { key: "scheduled", label: "Programada", color: "#8b5cf6" },
  { key: "in_progress", label: "En curs", color: "#10b981" },
  { key: "paused", label: "Pausada", color: "#6b7280" },
  { key: "completed", label: "Completada", color: "#14b8a6" },
  { key: "closed", label: "Tancada", color: "#6366f1" },
  { key: "cancelled", label: "Cancel·lada", color: "#ef4444" },
  { key: "waiting_parts", label: "Esperant peces", color: "#f97316" },
];

const PRIORITY_OPTIONS = [
  { key: "low", label: "Baixa", color: "#6b7280" },
  { key: "medium", label: "Mitja", color: "#3b82f6" },
  { key: "high", label: "Alta", color: "#f59e0b" },
  { key: "urgent", label: "Urgent", color: "#ef4444" },
];

function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const getParamArray = useCallback(
    (key: string) => {
      const val = searchParams.get(key);
      return val ? val.split(",") : [];
    },
    [searchParams]
  );

  const getParam = useCallback(
    (key: string) => searchParams.get(key) ?? "",
    [searchParams]
  );

  return { setParams, getParamArray, getParam };
}

function FilterDropdown({
  label,
  icon,
  activeCount,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  activeCount?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          activeCount
            ? "border-[var(--module-sat)]/30 bg-[var(--module-sat)]/10 text-[var(--module-sat)]"
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        }`}
      >
        {icon}
        <span>{label}</span>
        {activeCount ? (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--module-sat)] px-1 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg">
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function CheckboxItem({
  checked,
  onChange,
  label,
  color,
  icon,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  color?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--bg)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-[var(--border)]"
      />
      {icon}
      {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      <span className="text-[var(--text)]">{label}</span>
    </label>
  );
}

export function WorkOrderFilters({ categories, technicians }: Props) {
  const { setParams, getParamArray, getParam } = useFilterParams();

  const search = getParam("search");
  const statusFilters = getParamArray("status");
  const categoryFilters = getParamArray("category");
  const priorityFilters = getParamArray("priority");
  const technicianFilter = getParam("technician");
  const dateFrom = getParam("dateFrom");
  const dateTo = getParam("dateTo");
  const view = getParam("view") || "grid";

  const toggleArrayFilter = (key: string, value: string) => {
    const current = getParamArray(key);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setParams({ [key]: next.length > 0 ? next : null });
  };

  const clearAll = () => {
    setParams({
      search: null,
      status: null,
      category: null,
      priority: null,
      technician: null,
      dateFrom: null,
      dateTo: null,
      page: null,
    });
  };

  const hasFilters =
    statusFilters.length > 0 ||
    categoryFilters.length > 0 ||
    priorityFilters.length > 0 ||
    technicianFilter ||
    search ||
    dateFrom ||
    dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setParams({ search: e.target.value || null, page: null })}
          placeholder="Cerca..."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-8 pr-7 text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--module-sat)]"
        />
        {search && (
          <button
            onClick={() => setParams({ search: null, page: null })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterDropdown
        label="Estat"
        icon={<SlidersHorizontal className="h-3 w-3" />}
        activeCount={statusFilters.length || undefined}
      >
        {STATUS_OPTIONS.map((s) => (
          <CheckboxItem
            key={s.key}
            checked={statusFilters.includes(s.key)}
            onChange={() => toggleArrayFilter("status", s.key)}
            label={s.label}
            color={s.color}
          />
        ))}
      </FilterDropdown>

      <FilterDropdown
        label="Cat."
        icon={<CategoryIcon size={12} />}
        activeCount={categoryFilters.length || undefined}
      >
        {categories.map((c) => (
          <CheckboxItem
            key={c.id}
            checked={categoryFilters.includes(c.id)}
            onChange={() => toggleArrayFilter("category", c.id)}
            label={c.name}
            icon={<CategoryIcon slug={c.slug} color={c.color} size={14} />}
          />
        ))}
      </FilterDropdown>

      <FilterDropdown
        label="Prio."
        activeCount={priorityFilters.length || undefined}
      >
        {PRIORITY_OPTIONS.map((p) => (
          <CheckboxItem
            key={p.key}
            checked={priorityFilters.includes(p.key)}
            onChange={() => toggleArrayFilter("priority", p.key)}
            label={p.label}
          />
        ))}
      </FilterDropdown>

      <FilterDropdown
        label="Tècnic"
        icon={<User className="h-3 w-3" />}
        activeCount={technicianFilter ? 1 : undefined}
      >
        <button
          onClick={() => setParams({ technician: null, page: null })}
          className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${!technicianFilter ? "bg-[var(--bg)] font-medium text-[var(--module-sat)]" : "text-[var(--text)] hover:bg-[var(--bg)]"}`}
        >
          Tots
        </button>
        {technicians.map((tech) => (
          <button
            key={tech.id}
            onClick={() => setParams({ technician: tech.id, page: null })}
            className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
              technicianFilter === tech.id ? "bg-[var(--bg)] font-medium text-[var(--module-sat)]" : "text-[var(--text)] hover:bg-[var(--bg)]"
            }`}
          >
            {tech.name}
          </button>
        ))}
      </FilterDropdown>

      <FilterDropdown label="Dates" icon={<Calendar className="h-3 w-3" />} activeCount={dateFrom || dateTo ? 1 : undefined}>
        <div className="space-y-2 p-1">
          <div>
            <label className="text-xs text-[var(--text-muted)]">Des de</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setParams({ dateFrom: e.target.value || null, page: null })}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm text-[var(--text)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">Fins a</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setParams({ dateTo: e.target.value || null, page: null })}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-sm text-[var(--text)]"
            />
          </div>
        </div>
      </FilterDropdown>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <X className="h-3 w-3" />
          Netejar
        </button>
      )}

      {/* View switcher */}
      <div className="ml-auto flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
        <button
          onClick={() => setParams({ view: "grid" })}
          className={`rounded-md p-1.5 transition-colors ${
            view === "grid" ? "bg-[var(--module-sat)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
          title="Caixes"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setParams({ view: "table" })}
          className={`rounded-md p-1.5 transition-colors ${
            view === "table" ? "bg-[var(--module-sat)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
          title="Taula"
        >
          <Table2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setParams({ view: "kanban" })}
          className={`rounded-md p-1.5 transition-colors ${
            view === "kanban" ? "bg-[var(--module-sat)] text-white" : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
          title="Kanban"
        >
          <Columns3 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
