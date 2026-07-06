import Link from "next/link";
import { ShieldOff, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
          <ShieldOff className="h-8 w-8 text-red-500 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">غير مصرح بالوصول</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ليس لديك صلاحية للوصول إلى هذه الصفحة.
            إذا كنت تعتقد أن هذا خطأ، تواصل مع مدير النظام.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard">
            <Home className="h-4 w-4" />
            العودة إلى الرئيسية
          </Link>
        </Button>
      </div>
    </div>
  );
}
