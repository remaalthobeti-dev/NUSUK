"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Star,
  Timer,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/shared/stats-card";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "@/lib/data/admin";

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

/** Truncate long Arabic names for chart axes */
function truncate(name: string, len = 8) {
  return name.length > len ? name.slice(0, len) + "…" : name;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const {
    completedToday,
    activeTasksCount,
    avgTaskDurationHours,
    mostActiveEmployee,
    employeeWorkloads,
    teamWorkloads,
    taskStatusCounts,
    completionsByTeam,
  } = data;

  /* ── Export handlers ─────────────────────────── */
  async function handleExcelExport() {
    const XLSX = await import("xlsx");

    const wb = XLSX.utils.book_new();

    // Sheet 1: Analytics summary
    const summaryData = [
      ["المؤشر", "القيمة"],
      ["المهام المكتملة اليوم", completedToday],
      ["المهام النشطة", activeTasksCount],
      ["متوسط مدة المهمة (ساعة)", avgTaskDurationHours],
      ["الأكثر نشاطاً اليوم", mostActiveEmployee?.name ?? "-"],
      ["عدد نشاطاته", mostActiveEmployee?.count ?? 0],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "ملخص");

    // Sheet 2: Employee workloads
    if (employeeWorkloads.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(
        employeeWorkloads.map((e) => ({
          الموظف: e.name,
          الفريق: e.team,
          "عبء العمل %": e.workload,
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws2, "عبء العمل");
    }

    // Sheet 3: Team completions
    if (completionsByTeam.length > 0) {
      const ws3 = XLSX.utils.json_to_sheet(
        completionsByTeam.map((t) => ({
          الفريق: t.name,
          "مهام مكتملة": t.completed,
          "مهام نشطة": t.active,
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws3, "أداء الفرق");
    }

    XLSX.writeFile(wb, `تقرير-نسك-${new Date().toLocaleDateString("ar-SA")}.xlsx`);
  }

  function handlePrintExport() {
    window.print();
  }

  /* ── Stat cards ──────────────────────────────── */
  const statCards = [
    {
      title: "مهام مكتملة اليوم",
      value: completedToday,
      icon: <CheckCircle2 className="h-5 w-5" />,
      colorClass: "text-green-600 dark:text-green-400",
    },
    {
      title: "مهام نشطة الآن",
      value: activeTasksCount,
      icon: <ClipboardList className="h-5 w-5" />,
      colorClass: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "متوسط مدة المهمة",
      value: avgTaskDurationHours > 0 ? `${avgTaskDurationHours}س` : "—",
      subtitle: "بالساعات للمهام المكتملة",
      icon: <Timer className="h-5 w-5" />,
      colorClass: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "وقت الاستجابة",
      value: "—",
      subtitle: "بيانات غير كافية",
      icon: <Clock className="h-5 w-5" />,
      colorClass: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "الأكثر نشاطاً اليوم",
      value: mostActiveEmployee?.name ?? "—",
      subtitle: mostActiveEmployee ? `${mostActiveEmployee.count} نشاط` : "لا يوجد بيانات",
      icon: <Star className="h-5 w-5" />,
      colorClass: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="print:p-8">
      {/* Export buttons — hidden in print */}
      <div className="flex items-center gap-2 mb-6 print:hidden">
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExcelExport}>
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          تصدير Excel
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={handlePrintExport}>
          <Printer className="h-4 w-4" />
          طباعة / PDF
        </Button>
      </div>

      {/* Print header — only in print mode */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold">تقرير تحليلات نظام نسك</h1>
        <p className="text-sm text-muted-foreground mt-1">
          تاريخ التقرير: {new Date().toLocaleDateString("ar-SA")}
        </p>
      </div>

      {/* ── Stat Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            colorClass={card.colorClass}
          />
        ))}
      </div>

      {/* ── Charts Row 1 ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Employee workload chart */}
        <ChartCard title="عبء عمل الموظفين" icon={<Download className="h-4 w-4" />}>
          {employeeWorkloads.length === 0 ? (
            <EmptyState
              title="لا توجد بيانات"
              description="لم يتم تسجيل أي حضور بعد"
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={employeeWorkloads.map((e) => ({
                  ...e,
                  displayName: truncate(e.name),
                }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="displayName"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => [`${val}%`, "عبء العمل"]}
                  labelFormatter={(label) => `الموظف: ${label}`}
                />
                <Bar dataKey="workload" radius={[4, 4, 0, 0]}>
                  {employeeWorkloads.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.workload >= 80
                          ? "#ef4444"
                          : entry.workload >= 50
                            ? "#f59e0b"
                            : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Task status distribution */}
        <ChartCard title="توزيع حالات المهام">
          {taskStatusCounts.length === 0 ? (
            <EmptyState
              title="لا توجد مهام"
              description="لم يتم إنشاء أي مهام بعد"
            />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={taskStatusCounts}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="label"
                >
                  {taskStatusCounts.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(val: any) => [val, "مهمة"]} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2 ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team workload comparison */}
        <ChartCard title="متوسط عبء العمل بالفرق">
          {teamWorkloads.length === 0 ? (
            <EmptyState title="لا توجد بيانات" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={teamWorkloads}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(val: any) => [`${val}%`, "متوسط عبء العمل"]} />
                <Bar dataKey="avg" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Completions by team */}
        <ChartCard title="المهام المكتملة والنشطة بالفرق">
          {completionsByTeam.length === 0 ? (
            <EmptyState title="لا توجد بيانات" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={completionsByTeam.map((t) => ({
                  ...t,
                  name: truncate(t.name, 10),
                }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs">
                      {value === "completed" ? "مكتملة" : "نشطة"}
                    </span>
                  )}
                />
                <Bar dataKey="completed" name="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="active" name="active" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white/70 dark:bg-slate-900/70 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}
      </div>
      {children}
    </div>
  );
}
