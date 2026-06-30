"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DueDateFilter = "all" | "overdue" | "today" | "this_week" | "no_due";
export type SortOption = "newest" | "oldest" | "priority" | "due_date";

export interface FilterState {
  search: string;
  priority: TaskPriority | "all";
  status: TaskStatus | "all";
  dueDate: DueDateFilter;
  sortBy: SortOption;
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  priority: "all",
  status: "all",
  dueDate: "all",
  sortBy: "newest",
};

// ─── Option maps ──────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: Array<{ value: FilterState["priority"]; label: string }> = [
  { value: "all", label: "كل الأولويات" },
  { value: "urgent", label: "عاجل" },
  { value: "high", label: "عالية" },
  { value: "medium", label: "متوسطة" },
  { value: "low", label: "منخفضة" },
];

const STATUS_OPTIONS: Array<{ value: FilterState["status"]; label: string }> = [
  { value: "all", label: "كل الحالات" },
  { value: "in_progress", label: "جارية" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "on_hold", label: "متوقفة" },
  { value: "completed", label: "مكتملة" },
];

const DUE_DATE_OPTIONS: Array<{ value: DueDateFilter; label: string }> = [
  { value: "all", label: "كل المواعيد" },
  { value: "overdue", label: "متأخرة" },
  { value: "today", label: "اليوم" },
  { value: "this_week", label: "هذا الأسبوع" },
  { value: "no_due", label: "بلا موعد" },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "الأحدث" },
  { value: "oldest", label: "الأقدم" },
  { value: "priority", label: "الأعلى أولوية" },
  { value: "due_date", label: "تاريخ الاستحقاق" },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: FilterState;
  showStatusFilter: boolean;
  onChange: (next: FilterState) => void;
}

export function FilterBar({ filters, showStatusFilter, onChange }: FilterBarProps) {
  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="البحث في عنوان المهمة…"
          className="ps-9"
        />
      </div>

      {/* Dropdowns row */}
      <div className="flex flex-wrap gap-2">
        <SelectFilter
          value={filters.priority}
          options={PRIORITY_OPTIONS}
          onChange={(v) => set("priority", v as FilterState["priority"])}
        />

        {showStatusFilter && (
          <SelectFilter
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={(v) => set("status", v as FilterState["status"])}
          />
        )}

        <SelectFilter
          value={filters.dueDate}
          options={DUE_DATE_OPTIONS}
          onChange={(v) => set("dueDate", v as DueDateFilter)}
        />

        <SelectFilter
          value={filters.sortBy}
          options={SORT_OPTIONS}
          onChange={(v) => set("sortBy", v as SortOption)}
          className="ms-auto"
        />
      </div>
    </div>
  );
}

function SelectFilter({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        "cursor-pointer",
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
