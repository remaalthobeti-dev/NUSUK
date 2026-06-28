"use client";

import { useState, useCallback } from "react";
import { RefreshCw, FileSpreadsheet, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { getRoleLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "@/lib/data/admin";
import type { ActivityLog } from "@/types/database";

const ACTION_LABELS: Record<string, string> = {
  status_changed: "تغيير الحالة",
  started_task: "بدء مهمة",
  completed_task: "إنهاء مهمة",
  task_assigned: "تكليف مهمة",
  added_note: "إضافة ملاحظة",
  created: "إنشاء",
  updated: "تحديث",
  deleted: "حذف",
};

const ACTION_COLORS: Record<string, string> = {
  status_changed: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  started_task: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  completed_task: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  task_assigned: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  added_note: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
  created: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",
  updated: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  deleted: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

interface AuditLogViewProps {
  initialLogs: AuditLogEntry[];
  initialTotal: number;
  pageSize: number;
}

export function AuditLogView({
  initialLogs,
  initialTotal,
  pageSize,
}: AuditLogViewProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  const fetchPage = useCallback(
    async (p: number, q: string) => {
      setLoading(true);
      const supabase = createClient();
      const from = (p - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = (supabase.from("activity_logs") as unknown as {
        select: (cols: string, opts: { count: string }) => {
          order: (col: string, opts: { ascending: boolean }) => {
            range: (from: number, to: number) => Promise<{ data: ActivityLog[] | null; count: number | null }>;
          };
        };
      })
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      // For simplicity, we can't filter by actor name at DB level without a join
      // We filter client-side after fetch
      const { data, count } = await (query as unknown as Promise<{
        data: ActivityLog[] | null;
        count: number | null;
      }>);

      const rawLogs = (data ?? []) as ActivityLog[];

      // Batch-fetch actor names
      const actorIds = [...new Set(rawLogs.map((l) => l.actor_id).filter(Boolean))] as string[];
      let actorMap: Map<string, { full_name: string; role: string }> = new Map();

      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from("employees")
          .select("id, full_name, role")
          .in("id", actorIds);
        actorMap = new Map(
          ((actors ?? []) as Array<{ id: string; full_name: string; role: string }>).map(
            (a) => [a.id, a]
          )
        );
      }

      const enriched: AuditLogEntry[] = rawLogs.map((log) => {
        const actor = log.actor_id ? actorMap.get(log.actor_id) : null;
        return {
          ...log,
          actorName: actor?.full_name ?? null,
          actorRole: actor?.role ?? null,
        };
      });

      // Client-side search filter
      const filtered = q.trim()
        ? enriched.filter(
            (l) =>
              l.actorName?.includes(q) ||
              l.action.includes(q) ||
              l.entity_type.includes(q)
          )
        : enriched;

      setLogs(filtered);
      setTotal(count ?? 0);
      setLoading(false);
    },
    [pageSize]
  );

  function handlePageChange(p: number) {
    setPage(p);
    fetchPage(p, search);
  }

  async function handleExcelExport() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      logs.map((l) => ({
        الموظف: l.actorName ?? "—",
        الدور: l.actorRole ? getRoleLabel(l.actorRole as "admin" | "supervisor" | "employee") : "—",
        الإجراء: ACTION_LABELS[l.action] ?? l.action,
        النوع: l.entity_type,
        التاريخ: new Date(l.created_at).toLocaleString("ar-SA"),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "سجل النشاط");
    XLSX.writeFile(wb, `سجل-نشاط-نسك-${new Date().toLocaleDateString("ar-SA")}.xlsx`);
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap justify-between">
        <Input
          placeholder="بحث في السجل..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            fetchPage(1, e.target.value);
          }}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchPage(page, search)}
            title="تحديث"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExcelExport}>
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            تصدير Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <p className="text-xs text-muted-foreground mb-3">
        إجمالي السجلات: {total.toLocaleString("ar")} — صفحة {page} من {totalPages || 1}
      </p>

      {/* Table */}
      {logs.length === 0 ? (
        <EmptyState
          title="لا توجد سجلات"
          description="لم يتم تسجيل أي نشاط بعد"
        />
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموظف</TableHead>
                  <TableHead>الإجراء</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead>التوقيت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AuditRow({ log }: { log: AuditLogEntry }) {
  const actionLabel = ACTION_LABELS[log.action] ?? log.action.replace(/_/g, " ");
  const actionColor = ACTION_COLORS[log.action] ?? "bg-slate-100 text-slate-700";

  const detail = (() => {
    const vals = log.new_values as Record<string, string> | null;
    if (!vals) return null;
    return vals.task ?? vals.status ?? vals.note ?? null;
  })();

  const time = new Date(log.created_at).toLocaleString("ar-SA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <TableRow>
      <TableCell>
        {log.actorName ? (
          <div>
            <p className="text-sm font-medium">{log.actorName}</p>
            {log.actorRole && (
              <p className="text-[11px] text-muted-foreground">
                {getRoleLabel(log.actorRole as "admin" | "supervisor" | "employee")}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">النظام</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("text-xs border-0", actionColor)}>
          {actionLabel}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground font-mono">
          {log.entity_type}
        </span>
      </TableCell>
      <TableCell>
        {detail ? (
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{detail}</p>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground font-mono">{time}</span>
      </TableCell>
    </TableRow>
  );
}
