import Link from "next/link";
import Image from "next/image";
import { Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(36 57% 51% / .06) 0%, transparent 60%), hsl(45 25% 97%)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0 L32 16 L16 32 L0 16 Z' fill='none' stroke='%23C9963E' stroke-width='0.3' opacity='0.15'/%3E%3C/svg%3E"), radial-gradient(ellipse 80% 60% at 50% 0%, hsl(36 57% 51% / .06) 0%, transparent 60%)`,
      }}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/images/logo-nassaq.jpg"
            alt="نسك"
            width={64}
            height={67}
            style={{ height: 64, width: "auto", objectFit: "contain", opacity: 0.7 }}
          />
        </div>

        {/* 404 number */}
        <div className="relative">
          <p
            className="text-[120px] font-black leading-none select-none"
            style={{
              background: "linear-gradient(135deg, hsl(149 52% 9% / .08), hsl(149 52% 9% / .04))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-4px",
            }}
          >
            ٤٠٤
          </p>
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(149 52% 9%), hsl(149 45% 15%))",
                boxShadow: "0 8px 32px hsl(149 52% 9% / .25)",
              }}
            >
              <span className="text-2xl">🔍</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: "hsl(60 5% 10%)" }}>
            الصفحة غير موجودة
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(60 5% 55%)" }}>
            عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها.
            ربما تم نقلها أو حذفها أو أن الرابط غير صحيح.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "hsl(36 57% 51% / .2)" }} />
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M4 0L8 4L4 8L0 4Z" fill="hsl(201 96% 32% / 0)" stroke="hsl(36 57% 51% / .4)" strokeWidth="1" />
          </svg>
          <div className="flex-1 h-px" style={{ background: "hsl(36 57% 51% / .2)" }} />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(145deg, hsl(149 48% 11%), hsl(149 52% 9%))",
              color: "hsl(45 25% 97%)",
              boxShadow: "0 4px 18px hsl(149 52% 9% / .3)",
            }}
          >
            <Home className="h-4 w-4 shrink-0" />
            العودة للرئيسية
          </Link>
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold border transition-all duration-150 hover:bg-white"
            style={{
              borderColor: "hsl(60 5% 88%)",
              color: "hsl(60 5% 35%)",
              background: "hsl(45 25% 97%)",
            }}
          >
            <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" />
            الصفحة السابقة
          </Link>
        </div>
      </div>
    </div>
  );
}
