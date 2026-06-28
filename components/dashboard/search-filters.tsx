"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/types/database";
import { STATUS_CONFIG } from "./status-config";

const FILTER_STATUSES: AvailabilityStatus[] = [
  "available",
  "busy",
  "break",
  "meeting",
  "remote",
  "outside_office",
];

interface SearchFiltersProps {
  searchQuery: string;
  activeFilters: AvailabilityStatus[];
  onSearchChange: (q: string) => void;
  onFilterToggle: (s: AvailabilityStatus) => void;
  onClearAll: () => void;
  resultCount: number;
  totalCount: number;
}

export function SearchFilters({
  searchQuery,
  activeFilters,
  onSearchChange,
  onFilterToggle,
  onClearAll,
  resultCount,
  totalCount,
}: SearchFiltersProps) {
  const hasFilters = searchQuery.trim() || activeFilters.length > 0;

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="البحث بالاسم أو المهمة..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="ps-9 pe-9 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground shrink-0">تصفية:</span>
        {FILTER_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const active = activeFilters.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => onFilterToggle(s)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all duration-150",
                active
                  ? cn(cfg.badgeClass, "shadow-sm scale-[1.02]")
                  : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  active ? cfg.dotClass : "bg-muted-foreground/50"
                )}
              />
              {cfg.label}
            </button>
          );
        })}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs text-muted-foreground"
          >
            <X className="h-3 w-3 me-1" />
            مسح الكل
          </Button>
        )}
      </div>

      {/* Result count */}
      {hasFilters && (
        <p className="text-xs text-muted-foreground">
          عرض {resultCount} من {totalCount} موظف
        </p>
      )}
    </div>
  );
}
