"use client";

import { useState, useCallback } from "react";
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import type { TeamForSettings, EmployeeForSettings } from "@/lib/data/admin";
import type { Database, UserRole, AvailabilityStatus } from "@/types/database";

type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"];
type TeamUpdate = Database["public"]["Tables"]["teams"]["Update"];
type EmployeeInsert = Database["public"]["Tables"]["employees"]["Insert"];
type EmployeeUpdate = Database["public"]["Tables"]["employees"]["Update"];

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

const ROLES: UserRole[] = ["admin", "supervisor", "employee"];

const STATUS_LIST: AvailabilityStatus[] = [
  "available", "busy", "break", "meeting", "outside_office", "remote",
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
  const [teams, setTeams] = useState(initialTeams);
  const [employees, setEmployees] = useState(initialEmployees);

  const refreshTeams = useCallback(async () => {
    const supabase = createClient();
    const { data: t } = await supabase.from("teams").select("*").order("created_at");
    const { data: e } = await supabase
      .from("employees")
      .select("id, team_id")
      .eq("is_active", true);
    if (t) {
      const empList = (e ?? []) as Array<{ id: string; team_id: string | null }>;
      setTeams(
        (t as TeamForSettings[]).map((team) => ({
          ...team,
          employeeCount: empList.filter((emp) => emp.team_id === team.id).length,
        }))
      );
    }
  }, []);

  const refreshEmployees = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("employees")
      .select("*, teams!left(name, color)")
      .order("full_name");
    if (data) {
      setEmployees(
        (
          data as Array<
            EmployeeForSettings & { teams: { name: string; color: string } | null }
          >
        ).map((row) => ({
          ...row,
          teams: undefined,
          teamName: row.teams?.name ?? null,
          teamColor: row.teams?.color ?? null,
        }))
      );
    }
  }, []);

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
        <TeamsTab teams={teams} onRefresh={refreshTeams} />
      </TabsContent>

      {/* ── Employees ── */}
      <TabsContent value="employees">
        <EmployeesTab
          employees={employees}
          teams={teams}
          onRefresh={refreshEmployees}
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

  const [form, setForm] = useState({
    name: "",
    name_en: "",
    description: "",
    color: TEAM_COLORS[0],
    icon: "handshake",
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", name_en: "", description: "", color: TEAM_COLORS[0], icon: "handshake" });
    setDialogOpen(true);
  }

  function openEdit(team: TeamForSettings) {
    setEditing(team);
    setForm({
      name: team.name,
      name_en: team.name_en ?? "",
      description: team.description ?? "",
      color: team.color,
      icon: team.icon ?? "handshake",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setLoading(true);
    const supabase = createClient();

    if (editing) {
      await (supabase.from("teams") as unknown as { update: (v: TeamUpdate) => { eq: (k: string, v: string) => Promise<void> } }).update({
        name: form.name,
        name_en: form.name_en || null,
        description: form.description || null,
        color: form.color,
        icon: form.icon,
      }).eq("id", editing.id);
    } else {
      await (supabase.from("teams") as unknown as { insert: (v: TeamInsert) => Promise<void> }).insert({
        name: form.name,
        name_en: form.name_en || null,
        description: form.description || null,
        color: form.color,
        icon: form.icon,
        is_active: true,
      } as unknown as TeamInsert);
    }

    await onRefresh();
    setLoading(false);
    setDialogOpen(false);
  }

  async function toggleActive(team: TeamForSettings) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("teams") as any)
      .update({ is_active: !team.is_active })
      .eq("id", team.id);
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
                        title={team.is_active ? "تعطيل" : "تفعيل"}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "employee" as UserRole,
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
    setForm({ full_name: "", email: "", phone: "", role: "employee", team_id: "", is_active: true });
    setDialogOpen(true);
  }

  function openEdit(emp: EmployeeForSettings) {
    setEditing(emp);
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
    const supabase = createClient();

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || null,
      role: form.role,
      team_id: form.team_id || null,
      is_active: form.is_active,
    };

    if (editing) {
      await (supabase.from("employees") as unknown as {
        update: (v: EmployeeUpdate) => { eq: (k: string, v: string) => Promise<void> };
      }).update(payload as unknown as EmployeeUpdate).eq("id", editing.id);
    } else {
      await (supabase.from("employees") as unknown as {
        insert: (v: EmployeeInsert) => Promise<void>;
      }).insert(payload as unknown as EmployeeInsert);
    }

    await onRefresh();
    setLoading(false);
    setDialogOpen(false);
  }

  async function toggleActive(emp: EmployeeForSettings) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("employees") as any)
      .update({ is_active: !emp.is_active })
      .eq("id", emp.id);
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
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive(emp)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title={emp.is_active ? "تعطيل" : "تفعيل"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
                <Label>الدور</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {getRoleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>الفريق</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.team_id}
                  onChange={(e) => setForm({ ...form, team_id: e.target.value })}
                >
                  <option value="">بدون فريق</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
      role: "admin" as UserRole,
      label: "مدير النظام",
      description: "صلاحيات كاملة على جميع الفرق والموظفين والإعدادات",
      permissions: ["عرض جميع البيانات", "إدارة الفرق", "إدارة الموظفين", "تعديل الإعدادات", "تصدير التقارير"],
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-800",
    },
    {
      role: "supervisor" as UserRole,
      label: "مشرف",
      description: "إدارة فريقه وتكليف المهام ومتابعة حالات الموظفين",
      permissions: ["عرض بيانات الفريق", "تكليف المهام", "تحديث حالات الموظفين", "عرض التقارير"],
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      role: "employee" as UserRole,
      label: "موظف",
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
