"use client";

import { useState, useMemo } from "react";
import { Search, CheckSquare, Square, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DistributionCompany } from "@/types/distribution";

interface CompanySelectorProps {
  companies: DistributionCompany[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[], select: boolean) => void;
}

function CompanyColumn({
  title,
  companies,
  selectedIds,
  onToggle,
  onSelectAll,
}: {
  title: string;
  companies: DistributionCompany[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[], select: boolean) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      companies.filter((c) =>
        search ? c.name.toLowerCase().includes(search.toLowerCase()) : true
      ),
    [companies, search]
  );

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someSelected = filtered.some((c) => selectedIds.has(c.id));

  return (
    <div className="flex flex-col gap-3">
      {/* Column header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--n-ink-2))" }}>
          {title}
          <span className="ms-2 text-xs font-normal text-muted-foreground">
            ({companies.length})
          </span>
        </h3>
        {filtered.length > 0 && (
          <button
            type="button"
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "hsl(var(--n-gold))" }}
            onClick={() => onSelectAll(filtered.map((c) => c.id), !allSelected)}
          >
            {allSelected ? "إلغاء الكل" : "تحديد الكل"}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-8 h-8 text-xs"
        />
      </div>

      {/* Company list */}
      <div className="space-y-1 max-h-56 overflow-y-auto pe-1 scrollbar-hide">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 py-4 text-center">لا توجد نتائج</p>
        ) : (
          filtered.map((company) => {
            const selected = selectedIds.has(company.id);
            return (
              <button
                key={company.id}
                type="button"
                onClick={() => onToggle(company.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-start transition-all duration-150",
                  selected
                    ? "bg-[hsl(var(--n-gold)/0.12)] text-foreground"
                    : "hover:bg-muted/60 text-foreground/80"
                )}
              >
                {selected ? (
                  <CheckSquare
                    className="h-4 w-4 shrink-0"
                    style={{ color: "hsl(var(--n-gold))" }}
                  />
                ) : (
                  <Square className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                )}
                <span className="truncate font-medium text-sm">{company.name}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Selected count for this column */}
      {someSelected && (
        <p className="text-xs text-muted-foreground/70">
          {filtered.filter((c) => selectedIds.has(c.id)).length} محدد
        </p>
      )}
    </div>
  );
}

export function CompanySelector({
  companies,
  selectedIds,
  onToggle,
  onSelectAll,
}: CompanySelectorProps) {
  const inside = useMemo(
    () => companies.filter((c) => c.type === "inside").sort((a, b) => a.sort_order - b.sort_order),
    [companies]
  );
  const outside = useMemo(
    () => companies.filter((c) => c.type === "outside").sort((a, b) => a.sort_order - b.sort_order),
    [companies]
  );

  if (companies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center flex flex-col items-center gap-3"
        style={{ borderColor: "hsl(var(--n-gold) / .18)", background: "hsl(var(--n-gold) / .02)" }}>
        <Building2 className="h-8 w-8 opacity-25" style={{ color: "hsl(var(--n-gold))" }} />
        <p className="text-sm font-medium text-muted-foreground">لا توجد شركات مضافة</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5"
      style={{ borderColor: "hsl(var(--border))" }}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-4 w-4" style={{ color: "hsl(var(--n-gold))" }} />
        <h2 className="text-sm font-bold text-foreground">اختر الشركات</h2>
        {selectedIds.size > 0 && (
          <span
            className="ms-auto text-xs font-bold rounded-full px-2.5 py-0.5 text-white"
            style={{ background: "hsl(var(--n-gold))" }}
          >
            {selectedIds.size} محدد
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CompanyColumn
          title="شركات الداخل"
          companies={inside}
          selectedIds={selectedIds}
          onToggle={onToggle}
          onSelectAll={onSelectAll}
        />
        <div className="hidden md:block w-px" style={{ background: "hsl(var(--border))" }} />
        <CompanyColumn
          title="شركات الخارج"
          companies={outside}
          selectedIds={selectedIds}
          onToggle={onToggle}
          onSelectAll={onSelectAll}
        />
      </div>
    </div>
  );
}
