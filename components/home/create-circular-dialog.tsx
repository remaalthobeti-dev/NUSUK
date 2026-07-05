"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Megaphone, Loader2, Search, X, Users, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { createCircularAction, type AnnouncementTarget } from "@/app/(dashboard)/dashboard/circulars/actions";
import { toast } from "sonner";
import type { Team } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type TargetMode = "all" | "team" | "individuals";

interface EmployeeOption {
  id: string;
  full_name: string;
  job_title: string | null;
  team_name: string | null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateCircularDialogProps {
  teams: Team[];
}

// ─── Target mode config ───────────────────────────────────────────────────────

const TARGET_MODES: Array<{ value: TargetMode; label: string; icon: React.ElementType; desc: string }> = [
  { value: "all",         label: "جميع الموظفين", icon: Users,     desc: "إرسال لكل الفرق" },
  { value: "team",        label: "فريق محدد",     icon: Building2, desc: "اختر فريقًا واحدًا" },
  { value: "individuals", label: "أشخاص محددون",  icon: User,      desc: "ابحث وحدد الأشخاص" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateCircularDialog({ teams }: CreateCircularDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeOption[]>([]);

  // Employee search state
  const [allEmployees, setAllEmployees] = useState<EmployeeOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [isPending, startTransition] = useTransition();

  // Fetch employees when dialog opens
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("employees")
      .select("id, full_name, job_title, team:teams(name)")
      .eq("is_active", true)
      .order("full_name")
      .then(({ data }) => {
        setAllEmployees(
          (data ?? []).map((e) => ({
            id: e.id,
            full_name: e.full_name,
            job_title: e.job_title ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            team_name: (e.team as any)?.name ?? null,
          }))
        );
      });
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredEmployees = searchQuery.trim()
    ? allEmployees.filter(
        (e) =>
          e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.team_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allEmployees.slice(0, 8);

  function toggleEmployee(emp: EmployeeOption) {
    setSelectedEmployees((prev) =>
      prev.find((e) => e.id === emp.id)
        ? prev.filter((e) => e.id !== emp.id)
        : [...prev, emp]
    );
  }

  function resetForm() {
    setTitle("");
    setBody("");
    setTargetMode("all");
    setSelectedTeamId("");
    setSelectedEmployees([]);
    setSearchQuery("");
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) resetForm();
  }

  function buildTarget(): AnnouncementTarget {
    if (targetMode === "team") return { type: "team", teamId: selectedTeamId };
    if (targetMode === "individuals") return { type: "individuals", employeeIds: selectedEmployees.map((e) => e.id) };
    return { type: "all" };
  }

  function isValid() {
    if (!title.trim() || !body.trim()) return false;
    if (targetMode === "team" && !selectedTeamId) return false;
    if (targetMode === "individuals" && selectedEmployees.length === 0) return false;
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid()) return;
    startTransition(async () => {
      const result = await createCircularAction({ title, body, target: buildTarget() });
      if (result.error) {
        toast.error(result.error);
      } else {
        const targetLabel =
          targetMode === "all"
            ? "جميع الموظفين"
            : targetMode === "team"
            ? `فريق ${teams.find((t) => t.id === selectedTeamId)?.name ?? ""}`
            : `${selectedEmployees.length} موظف`;
        toast.success(`تم إرسال الإعلان إلى ${targetLabel}`);
        handleOpenChange(false);
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Megaphone className="h-4 w-4 me-1.5" />
        إنشاء إعلان
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              إنشاء إعلان جديد
            </DialogTitle>
            <DialogDescription>
              سيُرسَل الإعلان كإشعار للمستهدفين فور النشر.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">عنوان الإعلان</Label>
              <Input
                id="ann-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: إجازة رسمية يوم الأحد"
                maxLength={120}
                required
                disabled={isPending}
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label htmlFor="ann-body">محتوى الإعلان</Label>
              <Textarea
                id="ann-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب محتوى الإعلان هنا…"
                rows={3}
                maxLength={800}
                required
                disabled={isPending}
                className="resize-none"
              />
            </div>

            {/* Target mode */}
            <div className="space-y-2">
              <Label>المستهدفون</Label>
              <div className="grid grid-cols-3 gap-2">
                {TARGET_MODES.map(({ value, label, icon: Icon, desc }) => {
                  const isActive = targetMode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setTargetMode(value); setSelectedTeamId(""); setSelectedEmployees([]); }}
                      disabled={isPending}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/30 hover:bg-muted text-muted-foreground border-transparent"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                      <span className={cn("text-[10px] font-normal", isActive ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                        {desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team picker */}
            {targetMode === "team" && (
              <div className="space-y-1.5 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <Label>اختر الفريق</Label>
                <div className="grid grid-cols-2 gap-2">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTeamId(t.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium text-start transition-all",
                        selectedTeamId === t.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: t.color }}
                      />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Individual search */}
            {targetMode === "individuals" && (
              <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <Label>ابحث عن موظف</Label>

                {/* Search input + dropdown */}
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      placeholder="اسم الموظف أو المسمى الوظيفي…"
                      className="ps-9"
                      disabled={isPending}
                    />
                  </div>

                  {/* Dropdown results */}
                  {searchFocused && filteredEmployees.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg overflow-hidden">
                      <div className="max-h-48 overflow-y-auto">
                        {filteredEmployees.map((emp) => {
                          const isSelected = selectedEmployees.some((e) => e.id === emp.id);
                          return (
                            <button
                              key={emp.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { toggleEmployee(emp); setSearchQuery(""); }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2.5 text-start text-sm hover:bg-accent transition-colors",
                                isSelected && "bg-primary/5"
                              )}
                            >
                              <span className={cn(
                                "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                                isSelected ? "bg-primary border-primary" : "border-border"
                              )}>
                                {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{emp.full_name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {[emp.job_title, emp.team_name].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected chips */}
                {selectedEmployees.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedEmployees.map((emp) => (
                      <span
                        key={emp.id}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
                      >
                        {emp.full_name}
                        <button
                          type="button"
                          onClick={() => toggleEmployee(emp)}
                          className="hover:opacity-70 transition-opacity"
                          aria-label={`إزالة ${emp.full_name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {selectedEmployees.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    ابحث واختر الموظفين المستهدفين
                  </p>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending || !isValid()}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                ) : (
                  <Megaphone className="h-4 w-4 me-1.5" />
                )}
                نشر الإعلان
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
