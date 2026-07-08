import Link from "next/link";
import Image from "next/image";
import { Home, Mail } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{
        background: "hsl(45 25% 97%)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0 L32 16 L16 32 L0 16 Z' fill='none' stroke='%23C9963E' stroke-width='0.3' opacity='0.15'/%3E%3C/svg%3E")`,
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <Image src="/images/logo-nassaq.jpg" alt="نسك" width={64} height={67}
            style={{ height: 64, width: "auto", objectFit: "contain", opacity: 0.65 }} />
        </div>

        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(0 84% 60% / .08)", border: "1.5px solid hsl(0 84% 60% / .18)" }}>
            <span className="text-4xl">🔒</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: "hsl(60 5% 10%)" }}>غير مصرح بالوصول</h1>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(60 5% 55%)" }}>
            ليس لديك صلاحية للوصول إلى هذه الصفحة.
            إذا كنت تعتقد أن هذا خطأ، تواصل مع مدير النظام.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "hsl(36 57% 51% / .2)" }} />
          <div style={{ width: 6, height: 6, border: "1px solid hsl(36 57% 51% / .4)", transform: "rotate(45deg)" }} />
          <div className="flex-1 h-px" style={{ background: "hsl(36 57% 51% / .2)" }} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(145deg, hsl(149 48% 11%), hsl(149 52% 9%))", color: "hsl(45 25% 97%)", boxShadow: "0 4px 18px hsl(149 52% 9% / .3)" }}>
            <Home className="h-4 w-4 shrink-0" />
            العودة للرئيسية
          </Link>
          <Link href="mailto:admin@nusuk.sa"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold border transition-all duration-150 hover:bg-white"
            style={{ borderColor: "hsl(60 5% 88%)", color: "hsl(60 5% 35%)" }}>
            <Mail className="h-4 w-4 shrink-0" />
            التواصل مع الدعم
          </Link>
        </div>
      </div>
    </div>
  );
}
