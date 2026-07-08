import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Shield } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Team } from "@/types/database";

export const metadata: Metadata = { title: "إنشاء حساب جديد — نسك" };

export default async function RegisterPage() {
  let teams: Team[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("teams")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    teams = (data as Team[] | null) ?? [];
  } catch { /* teams stays empty */ }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 py-12"
      style={{
        background: "hsl(var(--n-ivory-2))",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0 L32 16 L16 32 L0 16 Z' fill='none' stroke='%23C9963E' stroke-width='0.3' opacity='0.18'/%3E%3C/svg%3E")`,
      }}
    >
      <div className="w-full max-w-xl space-y-6">

        {/* ── Header ── */}
        <div className="text-center space-y-2">
          {/* Lines + logo row */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, hsl(var(--n-gold)/0.6), transparent)" }} />
            <Image
              src="/images/logo-nassaq.jpg"
              alt="نسك"
              width={48}
              height={50}
              style={{ height: 50, width: "auto", objectFit: "contain" }}
              priority
            />
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, hsl(var(--n-gold)/0.6), transparent)" }} />
          </div>

          <h1
            className="text-2xl font-bold"
            style={{ color: "hsl(var(--n-dark))" }}
          >
            فريق بطاقات نسك
          </h1>
          <p
            className="text-base font-semibold"
            style={{ color: "hsl(var(--n-gold))" }}
          >
            يرحب بكم
          </p>

          {/* Ornamental separator */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px" style={{ background: "hsl(var(--n-gold)/0.35)" }} />
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 0L12 6L6 12L0 6Z" fill="hsl(var(--n-gold))" />
            </svg>
            <div className="flex-1 h-px" style={{ background: "hsl(var(--n-gold)/0.35)" }} />
          </div>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/80 overflow-hidden">
          <div className="px-8 pt-8 pb-2">
            <h2 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h2>
            <p className="text-sm text-gray-500 mt-1">
              سيتم مراجعة طلبك من قِبل مدير النظام قبل منح الوصول
            </p>
          </div>

          <div className="px-8 pb-8 pt-5">
            <RegisterForm teams={teams} />
          </div>

          {/* Login link */}
          <div
            className="px-8 py-4 text-center text-sm border-t"
            style={{ borderColor: "hsl(var(--n-ivory-3))", background: "hsl(var(--n-ivory-2)/0.5)" }}
          >
            <span className="text-gray-500">لديك حساب بالفعل؟</span>{" "}
            <Link
              href="/login"
              className="font-semibold hover:underline transition-colors"
              style={{ color: "hsl(var(--n-gold))" }}
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>

        {/* ── Security note ── */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Shield className="h-4 w-4" style={{ color: "hsl(var(--n-dark))" }} />
            <span className="font-semibold" style={{ color: "hsl(var(--n-dark))" }}>
              جميع بياناتك محمية وآمنة
            </span>
          </div>
          <p className="text-xs text-gray-400">
            نحن نلتزم بحماية خصوصيتك وبياناتك وفق أعلى المعايير الأمنية
          </p>
        </div>

      </div>
    </div>
  );
}
