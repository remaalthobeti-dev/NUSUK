import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "إعادة تعيين كلمة المرور" };

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl nusuk-gradient flex items-center justify-center shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">نسك</h1>
            <p className="text-muted-foreground mt-1">لوحة تحكم عمليات البطاقات</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">إعادة تعيين كلمة المرور</h2>
            <p className="text-sm text-muted-foreground mt-1">
              أنشئ كلمة مرور جديدة لحسابك
            </p>
          </div>
          <ResetPasswordForm />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} نسك — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
