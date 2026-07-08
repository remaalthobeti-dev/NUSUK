"use client";

import { useState, useMemo } from "react";
import { Search, CheckSquare, Square, Building2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DistributionCompany } from "@/types/distribution";

export type DistributionCenter = "mecca" | "medina";
export type CompanyTypeTab = "inside" | "outside";

const CENTERS: Array<{ id: DistributionCenter; label: string }> = [
  { id: "mecca",  label: "مركز توزيع مكة" },
  { id: "medina", label: "مركز توزيع المدينة" },
];

const TYPE_TABS: Array<{ id: CompanyTypeTab; label: string; count?: number }> = [
  { id: "inside",  label: "شركات الداخل" },
  { id: "outside", label: "شركات الخارج" },
];

interface CompanySelectorProps {
  companies: DistributionCompany[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[], select: boolean) => void;
  center: DistributionCenter | null;
  onCenterChange: (c: DistributionCenter) => void;
  activeType: CompanyTypeTab;
  onTypeChange: (t: CompanyTypeTab) => void;
}

export function CompanySelector({
  companies,
  selectedIds,
  onToggle,
  onSelectAll,
  center,
  onCenterChange,
  activeType,
  onTypeChange,
}: CompanySelectorProps) {
  const [search, setSearch] = useState("");

  const inside  = useMemo(() => companies.filter((c) => c.type === "inside"),  [companies]);
  const outside = useMemo(() => companies.filter((c) => c.type === "outside"), [companies]);

  const visibleCompanies = useMemo(() => {
    const base = activeType === "inside" ? inside : outside;
    return search
      ? base.filter((c) => c.name.includes(search))
      : base;
  }, [activeType, inside, outside, search]);

  const allVisible    = visibleCompanies.length > 0 && visibleCompanies.every((c) => selectedIds.has(c.id));
  const someVisible   = visibleCompanies.some((c) => selectedIds.has(c.id));
  const selectedCount = visibleCompanies.filter((c) => selectedIds.has(c.id)).length;

  return (
    <div className="space-y-4">

      {/* ── Step 1: Center tabs ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--n-gold))" }} />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            مركز التوزيع
          </span>
        </div>
        <div className="flex gap-2">
          {CENTERS.map((c) => {
            const active = center === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onCenterChange(c.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                  active
                    ? "text-white shadow-md"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                style={active ? { background: "hsl(var(--n-dark))" } : {}}
              >
                {active && (
                  <span
                    className="absolute inset-0 rounded-xl opacity-20"
                    style={{ background: "hsl(var(--n-gold))" }}
                  />
                )}
                <span className="relative">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Step 2: Company type + list (shown after center chosen) ── */}
      <div
        className={cn(
          "rounded-2xl border bg-card transition-all duration-300",
          center ? "opacity-100 translate-y-0" : "opacity-40 pointer-events-none translate-y-1"
        )}
        style={{ borderColor: "hsl(var(--border))" }}
      >
        {/* Type tabs */}
        <div
          className="flex items-center justify-between px-4 pt-4 pb-3 border-b"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
            {TYPE_TABS.map((t) => {
              const active  = activeType === t.id;
              const count   = t.id === "inside" ? inside.length : outside.length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { onTypeChange(t.id); setSearch(""); }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {t.label}
                  <span
                    className={cn(
                      "text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center tabular-nums",
                      active ? "text-white" : "text-muted-foreground bg-muted"
                    )}
                    style={active ? { background: "hsl(var(--n-gold))" } : {}}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {someVisible && (
              <span className="text-xs text-muted-foreground">
                <span className="font-bold" style={{ color: "hsl(var(--n-gold))" }}>
                  {selectedCount}
                </span>{" "}
                محدد
              </span>
            )}
            {visibleCompanies.length > 0 && (
              <button
                type="button"
                className="text-xs font-semibold transition-colors hover:opacity-75"
                style={{ color: "hsl(var(--n-gold))" }}
                onClick={() => onSelectAll(visibleCompanies.map((c) => c.id), !allVisible)}
              >
                {allVisible ? "إلغاء الكل" : "تحديد الكل"}
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              placeholder={`بحث في ${activeType === "inside" ? "شركات الداخل" : "شركات الخارج"}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-8 h-8 text-sm bg-muted/30 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Company list */}
        <div className="px-3 pb-3 max-h-72 overflow-y-auto">
          {visibleCompanies.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground/50">لا توجد نتائج</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {visibleCompanies.map((company) => {
                const selected = selectedIds.has(company.id);
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => onToggle(company.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-start",
                      "transition-all duration-150 group",
                      selected
                        ? "shadow-sm"
                        : "hover:bg-muted/50 text-foreground/75 hover:text-foreground"
                    )}
                    style={
                      selected
                        ? {
                            background: "hsl(var(--n-gold) / .1)",
                            color: "hsl(var(--foreground))",
                            outline: "1px solid hsl(var(--n-gold) / .25)",
                          }
                        : {}
                    }
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded transition-all duration-150",
                        selected ? "opacity-100 scale-100" : "opacity-30 scale-95 group-hover:opacity-60"
                      )}
                    >
                      {selected ? (
                        <CheckSquare
                          className="h-4 w-4"
                          style={{ color: "hsl(var(--n-gold))" }}
                        />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="truncate font-medium">{company.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!center && (
        <p className="text-xs text-muted-foreground/50 text-center">
          اختر مركز التوزيع أولاً لعرض الشركات
        </p>
      )}
    </div>
  );
}
