import type { Metadata } from "next";
import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "نسيت كلمة المرور — نسك" };

export default function ForgotPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "hsl(45 25% 95%)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0 L32 16 L16 32 L0 16 Z' fill='none' stroke='%23C9963E' stroke-width='0.3' opacity='0.18'/%3E%3C/svg%3E")`,
      }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Logo header */}
        <div className="flex items-center gap-4 text-center justify-center">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, hsl(36 57% 51% / .5), transparent)" }} />
          <Image src="/images/logo-nassaq.jpg" alt="نسك" width={48} height={50}
            style={{ height: 50, width: "auto", objectFit: "contain" }} priority />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, hsl(36 57% 51% / .5), transparent)" }} />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border p-8 space-y-5" style={{ borderColor: "hsl(60 5% 92%)" }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "hsl(60 5% 10%)" }}>نسيت كلمة المرور؟</h2>
            <p className="text-sm mt-1" style={{ color: "hsl(60 5% 55%)" }}>
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
            </p>
          </div>
          <ForgotPasswordForm />
        </div>

        <p className="text-center text-xs" style={{ color: "hsl(60 5% 65%)" }}>
          &copy; {new Date().getFullYear()} فريق بطاقات نسك — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
