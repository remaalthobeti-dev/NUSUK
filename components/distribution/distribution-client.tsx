"use client";

import { useState, useCallback, useEffect } from "react";
import { Send, ClipboardList, LayoutGrid, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { CompanySelector } from "./company-selector";
import { SendPanel } from "./send-panel";
import { RequestsTable } from "./requests-table";
import type { DistributionPageData } from "@/types/distribution";

type Tab = "send" | "requests";

interface Props {
  data: DistributionPageData;
}

export function DistributionClient({ data }: Props) {
  const { companies, pageRole, employeeId, employeeName } = data;
  const router = useRouter();

  const [requests, setRequests] = useState(data.requests);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>(
    pageRole === "corporate" ? "requests" : "send"
  );

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("distribution_requests_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "distribution_requests" },
        () => { router.refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // Sync requests from server on navigation
  useEffect(() => {
    setRequests(data.requests);
  }, [data.requests]);

  function toggleCompany(id: string) {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll(ids: string[], select: boolean) {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (select ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  function handleSendSuccess() {
    setSelectedCompanyIds(new Set());
    setActiveTab("requests");
    router.refresh();
  }

  // Tab definitions based on role
  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [];

  if (pageRole === "distribution" || pageRole === "admin") {
    tabs.push({ id: "send", label: "إجراء جديد", icon: Send });
  }
  tabs.push({ id: "requests", label: "الطلبات والسجل", icon: ClipboardList });

  // Pending count (new status)
  const pendingCount = requests.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      {/* Role badge */}
      <div className="flex items-center gap-3">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={
            pageRole === "distribution"
              ? { background: "hsl(201 96% 32% / .1)", color: "hsl(201 96% 32%)" }
              : pageRole === "corporate"
              ? { background: "hsl(142 71% 35% / .1)", color: "hsl(142 71% 35%)" }
              : { background: "hsl(var(--n-gold) / .1)", color: "hsl(var(--n-gold))" }
          }
        >
          <LayoutGrid className="h-3 w-3" />
          {pageRole === "distribution"
            ? "فريق التوزيع"
            : pageRole === "corporate"
            ? "فريق علاقات الشركات"
            : "مدير النظام"}
        </div>

        {pendingCount > 0 && (
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: "hsl(0 84% 60% / .1)", color: "hsl(0 70% 50%)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(0 70% 50%)" }} />
            {pendingCount} طلب جديد بانتظار المعالجة
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {t.id === "requests" && pendingCount > 0 && (
                  <span
                    className="text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center text-white tabular-nums"
                    style={{ background: "hsl(0 70% 50%)" }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Send tab (distribution team) ── */}
      {activeTab === "send" && (pageRole === "distribution" || pageRole === "admin") && (
        <div className="space-y-4">
          <CompanySelector
            companies={companies}
            selectedIds={selectedCompanyIds}
            onToggle={toggleCompany}
            onSelectAll={selectAll}
          />
          <SendPanel
            selectedIds={selectedCompanyIds}
            onSuccess={handleSendSuccess}
          />
        </div>
      )}

      {/* ── Requests tab ── */}
      {activeTab === "requests" && (
        <RequestsTable
          requests={requests}
          pageRole={pageRole}
          onRefresh={() => router.refresh()}
        />
      )}
    </div>
  );
}
