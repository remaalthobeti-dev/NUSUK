import type { Metadata } from "next";
import Image from "next/image";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "إعادة تعيين كلمة المرور — نسك" };

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "hsl(45 25% 95%)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0 L32 16 L16 32 L0 16 Z' fill='none' stroke='%23C9963E' stroke-width='0.3' opacity='0.18'/%3E%3C/svg%3E")`,
      }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-4 justify-center">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, hsl(36 57% 51% / .5), transparent)" }} />
          <Image src="/images/logo-nassaq.jpg" alt="نسك" width={48} height={50}
            style={{ height: 50, width: "auto", objectFit: "contain" }} priority />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, hsl(36 57% 51% / .5), transparent)" }} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border p-8 space-y-5" style={{ borderColor: "hsl(60 5% 92%)" }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "hsl(60 5% 10%)" }}>إعادة تعيين كلمة المرور</h2>
            <p className="text-sm mt-1" style={{ color: "hsl(60 5% 55%)" }}>
              أنشئ كلمة مرور جديدة لحسابك
            </p>
          </div>
          <ResetPasswordForm />
        </div>

        <p className="text-center text-xs" style={{ color: "hsl(60 5% 65%)" }}>
          &copy; {new Date().getFullYear()} فريق بطاقات نسك — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
