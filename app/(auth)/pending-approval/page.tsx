import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "في انتظار الموافقة" };

export default function PendingApprovalPage() {
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

        <div className="bg-card border rounded-2xl shadow-xl p-8 space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">طلبك قيد المراجعة</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              تم استلام طلب تسجيلك بنجاح. سيقوم مدير النظام بمراجعة طلبك
              وتفعيل حسابك في أقرب وقت ممكن.
            </p>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              العودة لتسجيل الدخول
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} نسك — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
