import type { Metadata } from "next";
import Image from "next/image";
import { CardShowcase } from "@/components/auth/card-showcase";
import { TypewriterTagline } from "@/components/auth/typewriter-tagline";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

/* ─────────────────────────────────────────────────────────────
   Login page — split layout
   RTL grid: col-1 = RIGHT (form), col-2 = LEFT (brand/card)
───────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <div
      className="nusuk-auth-layout grid min-h-screen"
      style={{
        direction: "rtl",
        gridTemplateColumns: "42fr 58fr",
      }}
    >
      {/* ════ FORM PANEL — right in RTL ════ */}
      <div
        className="nusuk-form-panel relative flex items-center justify-center px-12 py-14"
        style={{ background: "#FFFFFF", zIndex: 2 }}
      >
        {/* Subtle corner glows */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 55% 40% at 5% 95%,rgba(201,150,62,.055) 0%,transparent 60%)," +
              "radial-gradient(ellipse 40% 35% at 95% 5%,rgba(9,31,20,.03) 0%,transparent 55%)",
          }}
        />

        <div
          className="relative z-10 w-full"
          style={{
            maxWidth:  320,
            animation: "n-rise .85s .15s var(--n-ease-out) both",
          }}
        >
          {/* ── Logo area — official image, no frame ── */}
          <div className="mb-8" style={{ direction: "rtl" }}>

            {/* Official nusuk-logo.png — 152×159 source, displayed at 64px height */}
            <div className="mb-4">
              <Image
                src="/images/nusuk-logo.png"
                alt="بطاقة نُسك"
                width={152}
                height={159}
                style={{
                  height:    64,
                  width:     "auto",
                  objectFit: "contain",
                  display:   "block",
                }}
                priority
              />
            </div>

            {/* Gold divider */}
            <div
              className="mb-5"
              style={{
                width:      32,
                height:     2,
                background: "linear-gradient(90deg,#C9963E,transparent)",
                borderRadius: 2,
              }}
            />

            {/* System name */}
            <p
              className="mb-7"
              style={{ fontSize: 13, fontWeight: 600, color: "#58584F", letterSpacing: ".15px" }}
            >
              لوحة تحكم بطاقات نسك
            </p>

            {/* Heading */}
            <h1
              style={{
                fontSize:   42,
                fontWeight: 800,
                color:      "#1A1A17",
                letterSpacing: "-1px",
                lineHeight: 1.15,
                textWrap:   "balance",
                marginBottom: 10,
              }}
            >
              مرحباً بك
            </h1>
            <p style={{ fontSize: 13, color: "#9A9A90", lineHeight: 1.65, fontWeight: 400 }}>
              سجّل دخولك للوصول إلى لوحة التحكم
            </p>
          </div>

          {/* ── Form ── */}
          <LoginForm />
        </div>
      </div>

      {/* ════ BRAND PANEL — left in RTL ════ */}
      <div
        className="nusuk-brand-panel relative overflow-visible"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 55% 45%," +
            "hsl(45 35% 97%) 0%," +
            "hsl(44 28% 95%) 55%," +
            "hsl(43 22% 92%) 100%)",
          animation:      "n-rise .9s var(--n-ease-out) both",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}
      >
        <CardShowcase>
          <TypewriterTagline />
        </CardShowcase>
      </div>
    </div>
  );
}
