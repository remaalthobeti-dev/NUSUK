import type { Metadata } from "next";
import Link from "next/link";
import { Building2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "تم رفض الطلب" };

export default function RejectedPage() {
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
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">تم رفض طلبك</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              نأسف، لقد تم رفض طلب تسجيلك. للاستفسار يرجى التواصل مع مدير النظام.
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
