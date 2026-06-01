/**
 * Creation/modification date: 27/05/2026
 * Path: src/components/sat/WorkOrderFilters.tsx
 * Description: Compact single-row filter bar. All controls on one line.
 *              Sub-components live in ./work-orders/WorkOrderFilters/.
 */

"use client";

import { Search, X, Calendar, User, SlidersHorizontal } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { useFilterParams } from "./work-orders/WorkOrderFilters/useFilterParams";
import { FilterDropdown } from "./work-orders/WorkOrderFilters/FilterDropdown";
import { CheckboxItem } from "./work-orders/WorkOrderFilters/CheckboxItem";
import { ViewSwitcher, type WorkOrderView } from "./work-orders/WorkOrderFilters/ViewSwitcher";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "./work-orders/WorkOrderFilters/constants";

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

export function WorkOrderFilters({ categories, technicians }: Props) {
  const { setParams, getParamArray, getParam } = useFilterParams();

  const search = getParam("search");
  const statusFilters = getParamArray("status");
  const categoryFilters = getParamArray("category");
  const priorityFilters = getParamArray("priority");
  const technicianFilter = getParam("technician");
  const dateFrom = getParam("dateFrom");
  const dateTo = getParam("dateTo");
  const view = (getParam("view") || "grid") as WorkOrderView;

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
            type="button"
            onClick={() => setParams({ search: null, page: null })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Status filter */}
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

      {/* Category filter */}
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

      {/* Priority filter */}
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

      {/* Technician filter */}
      <FilterDropdown
        label="Tècnic"
        icon={<User className="h-3 w-3" />}
        activeCount={technicianFilter ? 1 : undefined}
      >
        <button
          type="button"
          onClick={() => setParams({ technician: null, page: null })}
          className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${!technicianFilter ? "bg-[var(--bg)] font-medium text-[var(--module-sat)]" : "text-[var(--text)] hover:bg-[var(--bg)]"}`}
        >
          Tots
        </button>
        {technicians.map((tech) => (
          <button
            key={tech.id}
            type="button"
            onClick={() => setParams({ technician: tech.id, page: null })}
            className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
              technicianFilter === tech.id ? "bg-[var(--bg)] font-medium text-[var(--module-sat)]" : "text-[var(--text)] hover:bg-[var(--bg)]"
            }`}
          >
            {tech.name}
          </button>
        ))}
      </FilterDropdown>

      {/* Date range filter */}
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

      {/* Clear all */}
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <X className="h-3 w-3" />
          Netejar
        </button>
      )}

      {/* View switcher */}
      <ViewSwitcher currentView={view} onChange={(v) => setParams({ view: v })} />
    </div>
  );
}
