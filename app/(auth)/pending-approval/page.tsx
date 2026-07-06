import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = { title: "في انتظار الموافقة — نسك" };

export default function PendingApprovalPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "hsl(45 25% 95%)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0 L32 16 L16 32 L0 16 Z' fill='none' stroke='%23C9963E' stroke-width='0.3' opacity='0.18'/%3E%3C/svg%3E")`,
      }}
    >
      <div className="w-full max-w-sm space-y-6 text-center">

        {/* Logo */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, hsl(36 57% 51% / .5), transparent)" }} />
          <Image src="/images/nusuk-logo.png" alt="نسك" width={48} height={50}
            style={{ height: 50, width: "auto", objectFit: "contain" }} priority />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, hsl(36 57% 51% / .5), transparent)" }} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border p-8 space-y-5" style={{ borderColor: "hsl(60 5% 92%)" }}>
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(38 92% 50% / .1)", border: "1.5px solid hsl(38 92% 50% / .2)" }}>
            <span className="text-3xl">⏳</span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold" style={{ color: "hsl(60 5% 10%)" }}>
              طلبك قيد المراجعة
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(60 5% 55%)" }}>
              تم استلام طلب تسجيلك بنجاح. سيقوم مدير النظام بمراجعة طلبك
              وتفعيل حسابك في أقرب وقت ممكن.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-11 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: "hsl(60 5% 88%)", color: "hsl(60 5% 35%)" }}
          >
            العودة لتسجيل الدخول
          </Link>
        </div>

        <p className="text-xs" style={{ color: "hsl(60 5% 65%)" }}>
          &copy; {new Date().getFullYear()} فريق بطاقات نسك — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
