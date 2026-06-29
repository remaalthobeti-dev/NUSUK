"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRoleLabel } from "@/lib/utils";
import type { Employee } from "@/types/database";

interface ProfileFormProps {
  employee: Employee;
}

export function ProfileForm({ employee }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(employee.full_name);
  const [jobTitle, setJobTitle] = useState(employee.job_title ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function saveProfile() {
    setSaving(true);
    setProfileMsg(null);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("employees") as any)
      .update({ full_name: fullName.trim(), job_title: jobTitle.trim() || null })
      .eq("id", employee.id);
    setSaving(false);
    if (error) {
      setProfileMsg({ type: "error", text: "حدث خطأ أثناء الحفظ" });
    } else {
      setProfileMsg({ type: "success", text: "تم حفظ البيانات بنجاح" });
      router.refresh();
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "كلمة المرور الجديدة غير متطابقة" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
      return;
    }
    setChangingPassword(true);
    setPasswordMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      setPasswordMsg({ type: "error", text: error.message });
    } else {
      setPasswordMsg({ type: "success", text: "تم تغيير كلمة المرور بنجاح" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">المعلومات الشخصية</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>الاسم الكامل</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>المسمى الوظيفي</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="مثال: محلل بيانات" />
          </div>
          <div className="space-y-1.5">
            <Label>البريد الإلكتروني</Label>
            <Input value={employee.email} disabled className="opacity-60" />
          </div>
          <div className="space-y-1.5">
            <Label>الصلاحية</Label>
            <Input value={getRoleLabel(employee.role)} disabled className="opacity-60" />
          </div>
        </div>

        {profileMsg && (
          <p className={`text-sm ${profileMsg.type === "success" ? "text-green-600" : "text-destructive"}`}>
            {profileMsg.text}
          </p>
        )}

        <Button onClick={saveProfile} disabled={saving || !fullName.trim()}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">تغيير كلمة المرور</h2>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>كلمة المرور الجديدة</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8 أحرف على الأقل"
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label>تأكيد كلمة المرور</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              dir="ltr"
            />
          </div>
        </div>

        {passwordMsg && (
          <p className={`text-sm ${passwordMsg.type === "success" ? "text-green-600" : "text-destructive"}`}>
            {passwordMsg.text}
          </p>
        )}

        <Button
          variant="outline"
          onClick={changePassword}
          disabled={changingPassword || !newPassword || !confirmPassword}
        >
          {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
          تغيير كلمة المرور
        </Button>
      </div>
    </div>
  );
}
