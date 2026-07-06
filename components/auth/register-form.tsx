"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Building2,
  Briefcase,
  Users,
  FileEdit,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Team } from "@/types/database";

interface RegisterFormProps {
  teams: Team[];
}

// ─── Styled input with icon ──────────────────────────────────────────────────

function FieldInput({
  id, name, type = "text", value, onChange, placeholder, required, dir,
  icon: Icon, autoComplete,
}: {
  id: string; name: string; type?: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; dir?: string;
  icon: React.ElementType; autoComplete?: string;
}) {
  return (
    <div className="relative flex items-center">
      <Icon className="absolute end-3 h-4 w-4 text-gray-400 pointer-events-none z-10" />
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        dir={dir}
        autoComplete={autoComplete}
        className="w-full h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 pe-10 ps-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--n-dark)/0.25)] focus:border-[hsl(var(--n-dark)/0.4)] placeholder:text-gray-400 transition-all"
      />
    </div>
  );
}

// ─── Password input ─────────────────────────────────────────────────────────

function PasswordInput({
  id, name, value, onChange, placeholder, required,
}: {
  id: string; name: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center">
      <Lock className="absolute end-3 h-4 w-4 text-gray-400 pointer-events-none z-10" />
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        dir="ltr"
        autoComplete="new-password"
        className="w-full h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 pe-10 ps-10 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--n-dark)/0.25)] focus:border-[hsl(var(--n-dark)/0.4)] placeholder:text-gray-400 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute start-3 z-10 text-gray-400 hover:text-gray-600 transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Select input (styled) ───────────────────────────────────────────────────

function FieldSelect({
  id, name, value, onChange, icon: Icon, children,
}: {
  id: string; name: string; value: string; onChange: (v: string) => void;
  icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center">
      <Icon className="absolute end-3 h-4 w-4 text-gray-400 pointer-events-none z-10" />
      <ChevronDown className="absolute start-3 h-4 w-4 text-gray-400 pointer-events-none z-10" />
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 pe-10 ps-9 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--n-dark)/0.25)] focus:border-[hsl(var(--n-dark)/0.4)] appearance-none transition-all"
        style={{ direction: "rtl" }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── Field wrapper ───────────────────────────────────────────────────────────

function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ms-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ─── NUSUK departments ───────────────────────────────────────────────────────

const DEPARTMENTS = [
  "إدارة العمليات",
  "إدارة خدمة الحجاج",
  "إدارة البطاقات",
  "إدارة تقنية المعلومات",
  "إدارة الموارد البشرية",
  "إدارة المالية",
  "إدارة التخطيط والتطوير",
  "إدارة الجودة",
  "إدارة الاتصال المؤسسي",
  "أخرى",
];

// ─── Main component ──────────────────────────────────────────────────────────

export function RegisterForm({ teams }: RegisterFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [teamId, setTeamId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError("الاسم الكامل مطلوب");
    if (password !== confirmPassword) return setError("كلمة المرور غير متطابقة");
    if (password.length < 8) return setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          department: department || undefined,
          job_title: jobTitle.trim() || undefined,
          team_id: teamId || undefined,
          notes: notes.trim() || undefined,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("هذا البريد الإلكتروني مسجل مسبقاً");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    router.push("/pending-approval");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">

      {/* Row 1: Name + Email */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="الاسم الكامل" required>
          <FieldInput
            id="fullName" name="fullName" value={fullName} onChange={setFullName}
            placeholder="أدخل اسمك الكامل" required icon={User}
            autoComplete="name"
          />
        </Field>
        <Field label="البريد الإلكتروني" required>
          <FieldInput
            id="email" name="email" type="email" value={email} onChange={setEmail}
            placeholder="example@domain.com" required icon={Mail} dir="ltr"
            autoComplete="email"
          />
        </Field>
      </div>

      {/* Row 2: Password + Confirm */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="كلمة المرور" required>
          <PasswordInput
            id="password" name="password" value={password} onChange={setPassword}
            placeholder="أدخل كلمة المرور" required
          />
        </Field>
        <Field label="تأكيد كلمة المرور" required>
          <PasswordInput
            id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={setConfirmPassword}
            placeholder="أعد كتابة كلمة المرور" required
          />
        </Field>
      </div>

      {/* Row 3: Phone + Department */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="رقم الجوال" required>
          <div className="flex gap-2">
            {/* Country code */}
            <div className="flex items-center gap-1 h-11 px-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 shrink-0 select-none">
              <ChevronDown className="h-3 w-3 text-gray-400" />
              <span className="font-medium" dir="ltr">+966</span>
            </div>
            <div className="relative flex-1 flex items-center">
              <Phone className="absolute end-3 h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <input
                id="phone" name="phone" type="tel" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5xxxxxxxx" required dir="ltr"
                autoComplete="tel"
                className="w-full h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 pe-10 ps-3 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--n-dark)/0.25)] focus:border-[hsl(var(--n-dark)/0.4)] placeholder:text-gray-400 transition-all"
              />
            </div>
          </div>
        </Field>
        <Field label="الإدارة" required>
          <FieldSelect
            id="department" name="department" value={department} onChange={setDepartment}
            icon={Building2}
          >
            <option value="">اختر الإدارة</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </FieldSelect>
        </Field>
      </div>

      {/* Row 4: Job title + Team */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="المسمى الوظيفي" required>
          <FieldInput
            id="jobTitle" name="jobTitle" value={jobTitle} onChange={setJobTitle}
            placeholder="أدخل المسمى الوظيفي" required icon={Briefcase}
          />
        </Field>
        <Field label="الفريق">
          <FieldSelect
            id="teamId" name="teamId" value={teamId} onChange={setTeamId}
            icon={Users}
          >
            <option value="">اختر الفريق (اختياري)</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </FieldSelect>
        </Field>
      </div>

      {/* Row 5: Notes (full width) */}
      <Field label="ملاحظات (اختياري)">
        <div className="relative">
          <FileEdit className="absolute end-3 top-3 h-4 w-4 text-gray-400 pointer-events-none z-10" />
          <textarea
            id="notes" name="notes" value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية ترغب في ذكرها"
            rows={2}
            className="w-full rounded-lg border border-gray-200 bg-white text-sm text-gray-900 pe-10 ps-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--n-dark)/0.25)] focus:border-[hsl(var(--n-dark)/0.4)] placeholder:text-gray-400 transition-all resize-none"
          />
        </div>
      </Field>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        style={{
          background: "hsl(var(--n-dark))",
          color: "hsl(var(--n-ivory))",
        }}
        onMouseEnter={(e) => {
          if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--n-forest))";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "hsl(var(--n-dark))";
        }}
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <UserPlus className="h-4 w-4" />
        }
        إنشاء حساب
      </button>
    </form>
  );
}
