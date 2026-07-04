"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, UserPlus, ShieldCheck, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email:    z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});
type LoginFormData = z.infer<typeof loginSchema>;

/* ── Field input — gold focus ring via CSS ──────────────────── */
function Field({
  id,
  type = "text",
  placeholder,
  autoComplete,
  hasError,
  endIcon,
  startSlot,
  dir = "ltr",
  registration,
}: {
  id: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  hasError?: boolean;
  endIcon?: React.ReactNode;
  startSlot?: React.ReactNode;
  dir?: "ltr" | "rtl";
  registration: ReturnType<ReturnType<typeof useForm<LoginFormData>>["register"]>;
}) {
  return (
    <div className="relative">
      {endIcon && (
        <span
          className="pointer-events-none absolute end-[14px] top-1/2 -translate-y-1/2"
          style={{ color: "#9A9A90" }}
        >
          {endIcon}
        </span>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        dir={dir}
        className="nusuk-field-input"
        data-error={hasError ? "true" : undefined}
        style={{
          paddingInlineEnd:   endIcon ? 42 : 16,
          paddingInlineStart: startSlot ? 42 : 16,
        }}
        {...registration}
      />
      {startSlot && (
        <span
          className="absolute start-[12px] top-1/2 -translate-y-1/2"
          style={{ color: "#9A9A90" }}
        >
          {startSlot}
        </span>
      )}
    </div>
  );
}

export function LoginForm() {
  const router                     = useRouter();
  const [showPw, setShowPw]        = useState(false);
  const [authError, setAuthError]  = useState<string | null>(null);
  const btnRef                     = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFormData) {
    setAuthError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    });
    if (error) {
      setAuthError(
        error.message === "Invalid login credentials"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مجدداً"
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  function handleRipple(e: React.PointerEvent<HTMLButtonElement>) {
    const btn = btnRef.current;
    if (!btn) return;
    const r    = btn.getBoundingClientRect();
    const span = document.createElement("span");
    span.style.cssText = `
      position:absolute;border-radius:50%;background:rgba(201,150,62,.22);
      width:8px;height:8px;
      top:${e.clientY - r.top - 4}px;left:${e.clientX - r.left - 4}px;
      transform:scale(0);animation:n-ripple .55s ease forwards;pointer-events:none;
    `;
    btn.appendChild(span);
    setTimeout(() => span.remove(), 600);
  }

  return (
    <>
      {/* Field input styles — defined here to avoid globals pollution */}
      <style>{`
        .nusuk-field-input {
          width:100%;
          padding:13px 16px;
          background:#F3F1EB;
          border:1.5px solid transparent;
          border-radius:9px;
          font-family:inherit;
          font-size:14px;
          color:#1A1A17;
          outline:none;
          transition:border-color 220ms,background 220ms,box-shadow 220ms;
          -webkit-appearance:none;
          appearance:none;
        }
        .nusuk-field-input::placeholder { color:#9A9A90; font-size:13px; }
        .nusuk-field-input:focus {
          border-color:#C9963E;
          background:#fff;
          box-shadow:0 0 0 3.5px rgba(201,150,62,.28);
        }
        .nusuk-field-input[data-error="true"] {
          background:#FEF2F2;
          border-color:#FCA5A5;
        }
      `}</style>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        dir="rtl"
      >
        {authError && (
          <div
            className="mb-5 rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-center text-[12px] text-red-700"
            style={{ animation: "n-fade .25s ease" }}
          >
            {authError}
          </div>
        )}

        {/* ── Email ── */}
        <div className="mb-5">
          <label
            htmlFor="email"
            className="mb-[7px] block text-[12px] font-semibold"
            style={{ color: "#58584F" }}
          >
            البريد الإلكتروني
          </label>
          <Field
            id="email"
            type="email"
            placeholder="example@email.com"
            autoComplete="email"
            hasError={!!errors.email}
            endIcon={<Mail size={15} />}
            registration={register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-[11px]" style={{ color: "#DC2626" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ── Password ── */}
        <div className="mb-5">
          <label
            htmlFor="password"
            className="mb-[7px] block text-[12px] font-semibold"
            style={{ color: "#58584F" }}
          >
            كلمة المرور
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute end-[14px] top-1/2 -translate-y-1/2"
              size={15}
              style={{ color: "#9A9A90" }}
            />
            <input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="nusuk-field-input"
              data-error={errors.password ? "true" : undefined}
              style={{ paddingInlineEnd: 42, paddingInlineStart: 42 }}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute start-[12px] top-1/2 -translate-y-1/2 p-1 transition-colors"
              style={{
                color: "#9A9A90", background: "none", border: "none", cursor: "pointer",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#58584F")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9A9A90")}
              aria-label={showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-[11px]" style={{ color: "#DC2626" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* ── Remember + forgot ── */}
        <div className="mb-6 flex items-center justify-between">
          <label
            className="flex cursor-pointer select-none items-center gap-[7px] text-[12px]"
            style={{ color: "#58584F" }}
          >
            <input
              type="checkbox"
              style={{
                width: 15, height: 15, flexShrink: 0,
                border: "1.5px solid rgba(0,0,0,.12)",
                borderRadius: 4, cursor: "pointer",
                accentColor: "#091F14",
              }}
            />
            تذكرني
          </label>
          <Link
            href="/forgot-password"
            className="text-[12px] font-medium"
            style={{ color: "#C9963E", transition: "color 150ms" }}
          >
            نسيت كلمة المرور؟
          </Link>
        </div>

        {/* ── Login button ── */}
        <button
          ref={btnRef}
          type="submit"
          disabled={isSubmitting}
          onPointerDown={handleRipple}
          className="relative mb-5 flex w-full items-center justify-center gap-2 overflow-hidden font-bold"
          style={{
            padding:       "15px 24px",
            background:    "linear-gradient(145deg,#0D2418,#091F14)",
            color:         "#C9963E",
            border:        "none",
            borderRadius:  9,
            fontSize:      14,
            cursor:        isSubmitting ? "not-allowed" : "pointer",
            opacity:       isSubmitting ? 0.8 : 1,
            boxShadow:     "0 4px 18px rgba(8,26,16,.32),0 1px 4px rgba(8,26,16,.2)",
            transition:    "box-shadow 220ms,transform 120ms",
            direction:     "rtl",
            letterSpacing: ".3px",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-[10%] top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg,transparent,rgba(201,150,62,.3),transparent)",
            }}
          />
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              جاري تسجيل الدخول...
            </>
          ) : (
            <>
              تسجيل الدخول
              <ArrowLeft size={14} style={{ opacity: 0.6 }} />
            </>
          )}
        </button>

        {/* ── Divider ── */}
        <div
          className="mb-5 flex items-center gap-3"
          style={{ color: "#9A9A90", fontSize: 11 }}
        >
          <span className="h-px flex-1" style={{ background: "rgba(0,0,0,.08)" }} />
          أو
          <span className="h-px flex-1" style={{ background: "rgba(0,0,0,.08)" }} />
        </div>

        {/* ── New user ── */}
        <button
          type="button"
          onClick={() => router.push("/register")}
          className="mb-8 flex w-full items-center justify-center gap-2 font-semibold"
          style={{
            padding: "13px 24px", background: "transparent",
            border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 9,
            fontSize: 13, color: "#58584F", cursor: "pointer",
            direction: "rtl", transition: "background 220ms,border-color 220ms,color 220ms",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background  = "#fff";
            el.style.borderColor = "rgba(201,150,62,.3)";
            el.style.color       = "#1A1A17";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background  = "transparent";
            el.style.borderColor = "rgba(0,0,0,.1)";
            el.style.color       = "#58584F";
          }}
        >
          <span
            className="flex items-center justify-center rounded-[5px]"
            style={{
              width: 18, height: 18, flexShrink: 0,
              background: "rgba(201,150,62,.12)", color: "#C9963E",
            }}
          >
            <UserPlus size={11} />
          </span>
          مستخدم جديد
        </button>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-center gap-[6px] text-center"
          style={{ color: "#9A9A90", fontSize: 10.5, lineHeight: 1.6 }}
        >
          <ShieldCheck size={11} style={{ flexShrink: 0 }} />
          منصة آمنة ومعتمدة — البيانات محمية وفق أعلى معايير الأمن السيبراني
        </div>
      </form>
    </>
  );
}
