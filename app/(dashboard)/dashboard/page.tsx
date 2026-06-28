import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  CheckSquare,
  UsersRound,
  Activity,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "الرئيسية",
};

async function getStats() {
  const supabase = await createClient();

  const [
    { count: teamsCount },
    { count: employeesCount },
    { count: tasksCount },
    { count: pendingTasksCount },
  ] = await Promise.all([
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("tasks").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return {
    teams: teamsCount ?? 0,
    employees: employeesCount ?? 0,
    tasks: tasksCount ?? 0,
    pendingTasks: pendingTasksCount ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    {
      title: "الفرق",
      value: stats.teams,
      icon: UsersRound,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950",
      change: "فريق نشط",
    },
    {
      title: "الموظفون",
      value: stats.employees,
      icon: Users,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950",
      change: "موظف نشط",
    },
    {
      title: "إجمالي المهام",
      value: stats.tasks,
      icon: CheckSquare,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950",
      change: "مهمة مسجلة",
    },
    {
      title: "مهام معلقة",
      value: stats.pendingTasks,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950",
      change: "بانتظار التنفيذ",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">
            مرحباً بك في نظام إدارة عمليات بطاقات نسك
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Activity className="h-3 w-3 text-green-500" />
          النظام يعمل
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placeholder sections for Phase 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-h-[200px]">
          <CardHeader>
            <CardTitle className="text-base">المهام الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              سيتم إضافة هذا القسم في المرحلة الثانية
            </p>
          </CardContent>
        </Card>
        <Card className="min-h-[200px]">
          <CardHeader>
            <CardTitle className="text-base">آخر النشاطات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              سيتم إضافة هذا القسم في المرحلة الثانية
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
