import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-6 max-w-md">
        <div className="space-y-2">
          <p className="text-8xl font-bold text-muted-foreground/30 select-none">403</p>
          <h1 className="text-2xl font-bold text-foreground">غير مصرح بالوصول</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            ليس لديك صلاحية للوصول إلى هذه الصفحة.
            <br />
            إذا كنت تعتقد أن هذا خطأ، تواصل مع مدير النظام.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
