"use client";

import { useState, useEffect } from "react";
import { ClipboardList, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { CompanySelector } from "./company-selector";
import type { DistributionCenter, CompanyTypeTab } from "./company-selector";
import { ActionSidePanel } from "./action-side-panel";
import { RequestsTable } from "./requests-table";
import type { DistributionPageData } from "@/types/distribution";

type Tab = "send" | "requests";

interface Props {
  data: DistributionPageData;
}

export function DistributionClient({ data }: Props) {
  const { companies, pageRole } = data;
  const router = useRouter();

  const [requests, setRequests]     = useState(data.requests);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [center, setCenter]         = useState<DistributionCenter | null>(null);
  const [activeType, setActiveType] = useState<CompanyTypeTab>("inside");
  const [activeTab, setActiveTab]   = useState<Tab>(
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

  useEffect(() => {
    setRequests(data.requests);
  }, [data.requests]);

  function handleTypeChange(t: CompanyTypeTab) {
    setActiveType(t);
    setSelectedIds(new Set());
  }

  function toggleCompany(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll(ids: string[], select: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (select ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  function handleSendSuccess() {
    setSelectedIds(new Set());
    setActiveTab("requests");
    router.refresh();
  }

  function handleRequestUpdate(id: string, patch: Partial<typeof requests[number]>) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [];
  if (pageRole === "distribution" || pageRole === "admin") {
    tabs.push({ id: "send", label: "إجراء جديد", icon: LayoutGrid });
  }
  tabs.push({ id: "requests", label: "الطلبات والسجل", icon: ClipboardList });

  const pendingCount = requests.filter((r) => r.status === "new").length;
  const panelOpen = selectedIds.size > 0 && center !== null &&
    (pageRole === "distribution" || pageRole === "admin");

  return (
    <>
      {/* Side panel */}
      {(pageRole === "distribution" || pageRole === "admin") && (
        <ActionSidePanel
          center={center}
          activeType={activeType}
          selectedIds={selectedIds}
          companies={companies}
          onSuccess={handleSendSuccess}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {/* Mobile overlay */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSelectedIds(new Set())}
          aria-hidden="true"
        />
      )}

      {/* Page content — shifts left on desktop when panel is open */}
      <div
        className={cn(
          "space-y-5 transition-all duration-300",
          panelOpen ? "lg:me-80" : ""
        )}
      >
        {/* Role badge */}
        <div className="flex items-center gap-3 flex-wrap">
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
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "hsl(0 70% 50%)" }}
              />
              {pendingCount} طلب جديد
            </div>
          )}
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
            {tabs.map((t) => {
              const Icon   = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    active
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

        {/* Send tab */}
        {activeTab === "send" && (pageRole === "distribution" || pageRole === "admin") && (
          <CompanySelector
            companies={companies}
            selectedIds={selectedIds}
            onToggle={toggleCompany}
            onSelectAll={selectAll}
            center={center}
            onCenterChange={(c) => { setCenter(c); setSelectedIds(new Set()); }}
            activeType={activeType}
            onTypeChange={handleTypeChange}
          />
        )}

        {/* Requests tab */}
        {activeTab === "requests" && (
          <RequestsTable
            requests={requests}
            pageRole={pageRole}
            onRefresh={() => router.refresh()}
            onRequestUpdate={handleRequestUpdate}
          />
        )}
      </div>
    </>
  );
}
