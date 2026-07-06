"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, UserPlus, ShieldCheck, ArrowLeft, CheckCircle2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email:    z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});
type LoginFormData = z.infer<typeof loginSchema>;

/* ─── Injected CSS ──────────────────────────────────────────────────────────
   All animation & interaction styles isolated here to avoid polluting globals.
   Uses transform/opacity only → GPU-composited, 60fps guaranteed.
   Respects prefers-reduced-motion.
*/
const STYLES = `
  /* ── Field base ── */
  .nf-input {
    width: 100%;
    padding: 13px 16px;
    background: #F3F1EB;
    border: 1.5px solid transparent;
    border-radius: 9px;
    font-family: inherit;
    font-size: 14px;
    color: #1A1A17;
    outline: none;
    transition:
      border-color 200ms cubic-bezier(.23,1,.32,1),
      background   200ms cubic-bezier(.23,1,.32,1),
      box-shadow   200ms cubic-bezier(.23,1,.32,1);
    -webkit-appearance: none;
    appearance: none;
  }
  .nf-input::placeholder { color: #9A9A90; font-size: 13px; }

  /* Focus state — green */
  .nf-input:focus {
    border-color: #1a7a45;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(26,122,69,.15), 0 1px 4px rgba(0,0,0,.06);
  }

  /* Error state */
  .nf-input[data-error="true"] {
    background: #FEF2F2;
    border-color: #FCA5A5;
  }
  .nf-input[data-error="true"]:focus {
    border-color: #EF4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,.12);
  }

  /* ── Shake on error ── */
  .nf-shake { animation: n-shake .42s cubic-bezier(.36,.07,.19,.97) both; }

  /* ── Primary button ── */
  .nf-btn-primary {
    transition:
      box-shadow  220ms cubic-bezier(.23,1,.32,1),
      transform   160ms cubic-bezier(.23,1,.32,1),
      opacity     200ms ease;
    will-change: transform;
  }
  .nf-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(8,26,16,.42), 0 2px 8px rgba(8,26,16,.24);
  }
  .nf-btn-primary:active:not(:disabled) {
    transform: scale(0.98) translateY(0);
    box-shadow: 0 2px 10px rgba(8,26,16,.28);
    transition-duration: 80ms;
  }

  /* ── Secondary button ── */
  .nf-btn-secondary {
    transition:
      background    220ms ease,
      border-color  220ms ease,
      color         220ms ease,
      box-shadow    220ms cubic-bezier(.23,1,.32,1),
      transform     160ms cubic-bezier(.23,1,.32,1);
    will-change: transform;
  }
  .nf-btn-secondary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,.08);
  }
  .nf-btn-secondary:active:not(:disabled) {
    transform: scale(0.98);
    transition-duration: 80ms;
  }

  /* ── Error message slide-down ── */
  .nf-error-msg { animation: n-slide-down .24s cubic-bezier(.23,1,.32,1) both; }

  /* ── Check icon pop-in ── */
  .nf-check-pop { animation: n-pop-in .22s cubic-bezier(.34,1.56,.64,1) both; }

  /* ── Success state pulse ── */
  .nf-success-pulse { animation: n-success-pulse .35s ease both; }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .nf-input, .nf-btn-primary, .nf-btn-secondary {
      transition: none !important;
    }
    .nf-btn-primary:hover:not(:disabled),
    .nf-btn-secondary:hover:not(:disabled) {
      transform: none !important;
    }
    .nf-shake, .nf-check-pop, .nf-error-msg, .nf-success-pulse {
      animation: none !important;
    }
  }
`;

/* ─── Field wrapper ──────────────────────────────────────────────────────── */
function Field({
  id, type = "text", placeholder, autoComplete, hasError, isValid,
  endIcon, startSlot, dir = "ltr", shake, registration,
}: {
  id: string; type?: string; placeholder?: string; autoComplete?: string;
  hasError?: boolean; isValid?: boolean; shake?: boolean;
  endIcon?: React.ReactNode; startSlot?: React.ReactNode; dir?: "ltr" | "rtl";
  registration: ReturnType<ReturnType<typeof useForm<LoginFormData>>["register"]>;
}) {
  return (
    <div className={`relative ${shake ? "nf-shake" : ""}`}>
      {endIcon && (
        <span className="pointer-events-none absolute end-[14px] top-1/2 -translate-y-1/2" style={{ color: "#9A9A90" }}>
          {endIcon}
        </span>
      )}
      {/* Green check — valid field */}
      {isValid && !hasError && (
        <span
          className="nf-check-pop pointer-events-none absolute end-[14px] top-1/2 -translate-y-1/2"
          style={{ color: "#1a7a45" }}
        >
          <Check size={14} strokeWidth={2.5} />
        </span>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        dir={dir}
        className="nf-input"
        data-error={hasError ? "true" : undefined}
        style={{
          paddingInlineEnd:   (endIcon || isValid) ? 42 : 16,
          paddingInlineStart: startSlot ? 42 : 16,
        }}
        {...registration}
      />
      {startSlot && (
        <span className="absolute start-[12px] top-1/2 -translate-y-1/2" style={{ color: "#9A9A90" }}>
          {startSlot}
        </span>
      )}
    </div>
  );
}

/* ─── Main form ──────────────────────────────────────────────────────────── */
export function LoginForm() {
  const router = useRouter();
  const [showPw, setShowPw]       = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [shakeEmail, setShakeEmail]   = useState(false);
  const [shakePass, setShakePass]     = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const emailVal = watch("email") ?? "";
  const passVal  = watch("password") ?? "";

  const emailValid = touchedFields.email   && !errors.email   && emailVal.length > 0;
  const passValid  = touchedFields.password && !errors.password && passVal.length > 0;

  async function onSubmit(data: LoginFormData) {
    setAuthError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    });
    if (error) {
      const msg =
        error.message === "Invalid login credentials"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مجدداً";
      setAuthError(msg);
      // Trigger shake on fields
      setShakeEmail(true);
      setShakePass(true);
      setTimeout(() => { setShakeEmail(false); setShakePass(false); }, 500);
      return;
    }
    // Brief success state before redirect
    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 550);
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

  const isLoading = isSubmitting || (success && !authError);

  return (
    <>
      <style>{STYLES}</style>

      <form onSubmit={handleSubmit(onSubmit)} noValidate dir="rtl">

        {/* ── Auth error ── */}
        {authError && (
          <div
            className="nf-error-msg mb-5 rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-center text-[12px] text-red-700"
          >
            {authError}
          </div>
        )}

        {/* ── Email ── */}
        <div className="mb-5">
          <label htmlFor="email" className="mb-[7px] block text-[12px] font-semibold" style={{ color: "#58584F" }}>
            البريد الإلكتروني
          </label>
          <Field
            id="email"
            type="email"
            placeholder="example@email.com"
            autoComplete="email"
            hasError={!!errors.email}
            isValid={emailValid}
            shake={shakeEmail}
            registration={register("email")}
          />
          {errors.email && (
            <p className="nf-error-msg mt-1.5 text-[11px]" style={{ color: "#DC2626" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* ── Password ── */}
        <div className="mb-5">
          <label htmlFor="password" className="mb-[7px] block text-[12px] font-semibold" style={{ color: "#58584F" }}>
            كلمة المرور
          </label>
          <div className={`relative ${shakePass ? "nf-shake" : ""}`}>
            <Lock
              className="pointer-events-none absolute end-[14px] top-1/2 -translate-y-1/2"
              size={15}
              style={{ color: errors.password ? "#FCA5A5" : passValid ? "#1a7a45" : "#9A9A90" }}
            />
            {/* Green check for valid password */}
            {passValid && !errors.password && (
              <span
                className="nf-check-pop pointer-events-none absolute end-[14px] top-1/2 -translate-y-1/2"
                style={{ color: "#1a7a45" }}
              >
                <Check size={14} strokeWidth={2.5} />
              </span>
            )}
            <input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="nf-input"
              data-error={errors.password ? "true" : undefined}
              style={{ paddingInlineEnd: 42, paddingInlineStart: 42 }}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute start-[12px] top-1/2 -translate-y-1/2 p-1"
              style={{
                color: "#9A9A90", background: "none", border: "none", cursor: "pointer",
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#58584F")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9A9A90")}
              aria-label={showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <p className="nf-error-msg mt-1.5 text-[11px]" style={{ color: "#DC2626" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* ── Remember + forgot ── */}
        <div className="mb-6 flex items-center justify-between">
          <label className="flex cursor-pointer select-none items-center gap-[7px] text-[12px]" style={{ color: "#58584F" }}>
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
            style={{ color: "#C9963E", transition: "color 150ms ease" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#a37b30")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#C9963E")}
          >
            نسيت كلمة المرور؟
          </Link>
        </div>

        {/* ── Login button ── */}
        <button
          ref={btnRef}
          type="submit"
          disabled={isLoading}
          onPointerDown={handleRipple}
          className={`nf-btn-primary relative mb-5 flex w-full items-center justify-center gap-2 overflow-hidden font-bold ${success ? "nf-success-pulse" : ""}`}
          style={{
            padding:       "15px 24px",
            background:    success
              ? "linear-gradient(145deg,#12622e,#0b4520)"
              : "linear-gradient(145deg,#0D2418,#091F14)",
            color:         success ? "#6ee79d" : "#C9963E",
            border:        "none",
            borderRadius:  9,
            fontSize:      14,
            cursor:        isLoading ? "not-allowed" : "pointer",
            opacity:       isLoading && !success ? 0.85 : 1,
            boxShadow:     "0 4px 18px rgba(8,26,16,.32),0 1px 4px rgba(8,26,16,.2)",
            direction:     "rtl",
            letterSpacing: ".3px",
          }}
        >
          {/* Gold shimmer line */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-[10%] top-0 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(201,150,62,.3),transparent)" }}
          />
          {success ? (
            <>
              <CheckCircle2 size={16} style={{ color: "#6ee79d" }} />
              تم تسجيل الدخول
            </>
          ) : isSubmitting ? (
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
        <div className="mb-5 flex items-center gap-3" style={{ color: "#9A9A90", fontSize: 11 }}>
          <span className="h-px flex-1" style={{ background: "rgba(0,0,0,.08)" }} />
          أو
          <span className="h-px flex-1" style={{ background: "rgba(0,0,0,.08)" }} />
        </div>

        {/* ── New user button ── */}
        <button
          type="button"
          onClick={() => router.push("/register")}
          className="nf-btn-secondary mb-8 flex w-full items-center justify-center gap-2 font-semibold"
          style={{
            padding: "13px 24px", background: "transparent",
            border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 9,
            fontSize: 13, color: "#58584F", cursor: "pointer",
            direction: "rtl",
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
