"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Plus,
  Edit2,
  Power,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { STATUS_CONFIG } from "@/components/dashboard/status-config";
import { getRoleLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  createTeamAction,
  updateTeamAction,
  setTeamActiveAction,
  setTeamDistributionRoleAction,
  createEmployeeAction,
  updateEmployeeAction,
  setEmployeeActiveAction,
} from "@/app/(dashboard)/dashboard/settings/actions";
import type { TeamForSettings, EmployeeForSettings } from "@/lib/data/admin";
import type { UserRole, AvailabilityStatus } from "@/types/database";

const TEAM_COLORS = [
  "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

const TEAM_ICONS = [
  { value: "handshake", label: "🤝 علاقات" },
  { value: "truck", label: "📦 توزيع" },
  { value: "cpu", label: "💻 تقني" },
  { value: "settings", label: "⚙️ تشغيل" },
  { value: "users", label: "👥 افتراضي" },
];

const ROLES: UserRole[] = ["super_admin", "track_manager", "team_member"];

const STATUS_LIST: AvailabilityStatus[] = [
  "available", "busy", "in_meeting", "field_work", "remote", "offline",
];

// ─────────────────────────────────────────────────────────────────────────────

interface SettingsDashboardProps {
  initialTeams: TeamForSettings[];
  initialEmployees: EmployeeForSettings[];
}

export function SettingsDashboard({
  initialTeams,
  initialEmployees,
}: SettingsDashboardProps) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
  const [employees, setEmployees] = useState(initialEmployees);

  // Sync with server-rendered data after router.refresh()
  useEffect(() => { setTeams(initialTeams); }, [initialTeams]);
  useEffect(() => { setEmployees(initialEmployees); }, [initialEmployees]);

  const refresh = useCallback(async () => {
    router.refresh();
  }, [router]);

  return (
    <Tabs defaultValue="teams">
      <TabsList className="mb-6 flex-wrap h-auto gap-1">
        <TabsTrigger value="teams" className="gap-2">
          <Building2 className="h-4 w-4" />
          إدارة الفرق
        </TabsTrigger>
        <TabsTrigger value="employees" className="gap-2">
          <Users className="h-4 w-4" />
          إدارة الموظفين
        </TabsTrigger>
        <TabsTrigger value="roles" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          الأدوار والصلاحيات
        </TabsTrigger>
        <TabsTrigger value="statuses" className="gap-2">
          <Activity className="h-4 w-4" />
          حالات التواجد
        </TabsTrigger>
      </TabsList>

      {/* ── Teams ── */}
      <TabsContent value="teams">
        <TeamsTab teams={teams} onRefresh={refresh} />
      </TabsContent>

      {/* ── Employees ── */}
      <TabsContent value="employees">
        <EmployeesTab
          employees={employees}
          teams={teams}
          onRefresh={refresh}
        />
      </TabsContent>

      {/* ── Roles ── */}
      <TabsContent value="roles">
        <RolesTab />
      </TabsContent>

      {/* ── Statuses ── */}
      <TabsContent value="statuses">
        <StatusesTab />
      </TabsContent>
    </Tabs>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Teams Tab
// ─────────────────────────────────────────────────────────────────────────────

function TeamsTab({
  teams,
  onRefresh,
}: {
  teams: TeamForSettings[];
  onRefresh: () => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamForSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    name_en: "",
    description: "",
    color: TEAM_COLORS[0],
    icon: "handshake",
    distributionRole: "_none" as "_none" | "distribution" | "corporate",
  });

  function openCreate() {
    setEditing(null);
    setActionError(null);
    setForm({ name: "", name_en: "", description: "", color: TEAM_COLORS[0], icon: "handshake", distributionRole: "_none" });
    setDialogOpen(true);
  }

  function openEdit(team: TeamForSettings) {
    setEditing(team);
    setActionError(null);
    setForm({
      name: team.name,
      name_en: team.name_en ?? "",
      description: team.description ?? "",
      color: team.color,
      icon: team.icon ?? "handshake",
      distributionRole: team.distributionRole ?? "_none",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setLoading(true);
    setActionError(null);

    const payload = {
      name: form.name,
      name_en: form.name_en || null,
      description: form.description || null,
      color: form.color,
      icon: form.icon,
    };

    const teamResult = editing
      ? await updateTeamAction(editing.id, payload)
      : await createTeamAction(payload);

    if (teamResult.error) {
      setLoading(false);
      setActionError(teamResult.error);
      return;
    }

    // Save distribution role if editing an existing team
    if (editing) {
      const distRole = form.distributionRole === "_none" ? null : form.distributionRole;
      const distResult = await setTeamDistributionRoleAction(editing.id, distRole);
      if (distResult.error) {
        setLoading(false);
        setActionError(distResult.error);
        return;
      }
    }

    setLoading(false);
    await onRefresh();
    setDialogOpen(false);
  }

  async function toggleActive(team: TeamForSettings) {
    await setTeamActiveAction(team.id, !team.is_active);
    await onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          إجمالي: {teams.length} فريق
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onRefresh} title="تحديث">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            فريق جديد
          </Button>
        </div>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          title="لا توجد فرق"
          action={<Button onClick={openCreate}>إنشاء أول فريق</Button>}
        />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الفريق</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>عدد الموظفين</TableHead>
                <TableHead>دور التوزيع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-8 rounded-full shrink-0"
                        style={{ background: team.color }}
                      />
                      <div>
                        <p className="font-medium text-sm">{team.name}</p>
                        {team.name_en && (
                          <p className="text-xs text-muted-foreground">{team.name_en}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {team.description ?? "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{team.employeeCount}</span>
                  </TableCell>
                  <TableCell>
                    {team.distributionRole === "distribution" ? (
                      <Badge className="text-xs" style={{ background: "hsl(201 96% 32% / .12)", color: "hsl(201 96% 32%)", border: "1px solid hsl(201 96% 32% / .25)" }}>
                        فريق التوزيع
                      </Badge>
                    ) : team.distributionRole === "corporate" ? (
                      <Badge className="text-xs" style={{ background: "hsl(142 71% 35% / .12)", color: "hsl(142 71% 35%)", border: "1px solid hsl(142 71% 35% / .25)" }}>
                        علاقات الشركات
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={team.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {team.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(team)}
                        title="تعديل"
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(team)}
                        title={team.is_active ? "تعطيل الفريق" : "تفعيل الفريق"}
                        className={`h-8 w-8 transition-colors ${
                          team.is_active
                            ? "text-muted-foreground hover:text-destructive"
                            : "text-muted-foreground hover:text-emerald-600"
                        }`}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الفريق" : "فريق جديد"}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>اسم الفريق *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: فريق مسار العلاقات"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الاسم بالإنجليزية</Label>
              <Input
                value={form.name_en}
                dir="ltr"
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                placeholder="Relations Team"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="وصف مختصر للفريق"
              />
            </div>
            <div className="space-y-2">
              <Label>لون الفريق</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {TEAM_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform",
                      form.color === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>أيقونة الفريق</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {TEAM_ICONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, icon: value })}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm border transition-all",
                      form.icon === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {editing && (
              <div className="space-y-1.5">
                <Label>دور توزيع نسك</Label>
                <Select
                  value={form.distributionRole}
                  onValueChange={(v) => setForm({ ...form, distributionRole: v as typeof form.distributionRole })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">بدون دور توزيع</SelectItem>
                    <SelectItem value="distribution">فريق التوزيع</SelectItem>
                    <SelectItem value="corporate">فريق علاقات الشركات</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  يحدد الصفحات التي تظهر في القائمة الجانبية لأعضاء هذا الفريق
                </p>
              </div>
            )}
            {actionError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{actionError}</p>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={loading || !form.name.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "حفظ التغييرات" : "إنشاء الفريق"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employees Tab
// ─────────────────────────────────────────────────────────────────────────────

function EmployeesTab({
  employees,
  teams,
  onRefresh,
}: {
  employees: EmployeeForSettings[];
  teams: TeamForSettings[];
  onRefresh: () => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeForSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "team_member" as UserRole,
    team_id: "",
    is_active: true,
  });

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setActionError(null);
    setForm({ full_name: "", email: "", phone: "", role: "team_member", team_id: "", is_active: true });
    setDialogOpen(true);
  }

  function openEdit(emp: EmployeeForSettings) {
    setEditing(emp);
    setActionError(null);
    setForm({
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone ?? "",
      role: emp.role,
      team_id: emp.team_id ?? "",
      is_active: emp.is_active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.email.trim()) return;
    setLoading(true);
    setActionError(null);

    const result = editing
      ? await updateEmployeeAction(editing.id, {
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || null,
          role: form.role,
          team_id: form.team_id || null,
          is_active: form.is_active,
        })
      : await createEmployeeAction({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || null,
          role: form.role,
          team_id: form.team_id || null,
        });

    setLoading(false);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    await onRefresh();
    setDialogOpen(false);
  }

  async function toggleActive(emp: EmployeeForSettings) {
    await setEmployeeActiveAction(emp.id, !emp.is_active);
    await onRefresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            موظف جديد
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="لا يوجد موظفون"
          description={search ? "لا توجد نتائج للبحث" : undefined}
          action={!search ? <Button onClick={openCreate}>إضافة موظف</Button> : undefined}
        />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الفريق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{emp.full_name}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getRoleLabel(emp.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {emp.teamName ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: emp.teamColor ?? "#ccc" }}
                        />
                        <span className="text-sm">{emp.teamName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={emp.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {emp.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(emp)}
                        className="h-8 w-8"
                        title="تعديل"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(emp)}
                        className={`h-8 w-8 transition-colors ${
                          emp.is_active
                            ? "text-muted-foreground hover:text-destructive"
                            : "text-muted-foreground hover:text-emerald-600"
                        }`}
                        title={emp.is_active ? "تعطيل الموظف" : "تفعيل الموظف"}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل بيانات الموظف" : "موظف جديد"}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>الاسم الكامل *</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="محمد أحمد العتيبي"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>البريد الإلكتروني *</Label>
                <Input
                  type="email"
                  dir="ltr"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@nusuk.sa"
                />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الجوال</Label>
                <Input
                  dir="ltr"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+966 5X XXX XXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">الدور</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{getRoleLabel(r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-xs font-semibold">الفريق</Label>
                <Select value={form.team_id || "_none"} onValueChange={(v) => setForm({ ...form, team_id: v === "_none" ? "" : v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="بدون فريق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">بدون فريق</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {actionError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{actionError}</p>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !form.full_name.trim() || !form.email.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "حفظ التغييرات" : "إضافة الموظف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Roles Tab
// ─────────────────────────────────────────────────────────────────────────────

function RolesTab() {
  const roles = [
    {
      role: "super_admin" as UserRole,
      label: "مدير النظام",
      description: "صلاحيات كاملة على جميع الفرق والموظفين والإعدادات",
      permissions: ["عرض جميع البيانات", "إدارة الفرق", "إدارة الموظفين", "تعديل الإعدادات", "تصدير التقارير"],
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-800",
    },
    {
      role: "track_manager" as UserRole,
      label: "مشرف المسار",
      description: "إدارة فريقه وتكليف المهام ومتابعة حالات الموظفين",
      permissions: ["عرض بيانات الفريق", "تكليف المهام", "تحديث حالات الموظفين", "عرض التقارير"],
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      role: "team_member" as UserRole,
      label: "عضو الفريق",
      description: "تحديث حالته الخاصة وعرض مهامه المكلف بها",
      permissions: ["تحديث الحالة الشخصية", "عرض المهام المكلف بها", "إضافة ملاحظات"],
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {roles.map(({ label, description, permissions, color, bg, border }) => (
        <div key={label} className={cn("rounded-xl border p-5", bg, border)}>
          <h3 className={cn("font-bold text-base mb-1", color)}>{label}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <ul className="space-y-1.5">
            {permissions.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm">
                <span className={cn("w-1.5 h-1.5 rounded-full", color.replace("text-", "bg-"))} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Statuses Tab
// ─────────────────────────────────────────────────────────────────────────────

function StatusesTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {STATUS_LIST.map((status) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <div
            key={status}
            className={cn(
              "rounded-xl border p-4 flex items-center gap-4",
              cfg.badgeClass
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0",
                cfg.dotClass.replace("bg-", "bg-").replace("500", "100")
              )}
            >
              <span className={cn("w-4 h-4 rounded-full", cfg.dotClass)} />
            </div>
            <div>
              <p className="font-semibold text-sm">{cfg.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                المعرف: <code className="font-mono">{status}</code>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
