import type { Metadata } from "next";
import Image from "next/image";
import { CardShowcase } from "@/components/auth/card-showcase";
import { TypewriterTagline } from "@/components/auth/typewriter-tagline";
import { IslamicBackground } from "@/components/auth/islamic-background";
import { LoginForm } from "@/components/auth/login-form";
import { VerticalDivider } from "@/components/auth/vertical-divider";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
};

/*
  Layout: two-column RTL grid on a single white background.
  IslamicBackground draws low-opacity gold patterns at the page edges.
  RTL grid: col-1 (first child) = RIGHT → form panel
            col-2 (second child) = LEFT  → card panel
*/
export default function LoginPage() {
  return (
    <>
      {/* Full-page Mecca background — fixed behind everything */}
      {/*
        opacity: 0.25 on wrapper → left side (mask=1.0) shows at 25%
        right side mask=0.48 → 0.25×0.48≈12%
        Column split: left 58% = card panel, right 42% = form panel (RTL)
      */}
      <div
        aria-hidden
        style={{
          position:      "fixed",
          inset:         0,
          zIndex:        0,
          pointerEvents: "none",
          opacity:       0.25,
          WebkitMaskImage: "linear-gradient(to right, black 0% 58%, rgba(0,0,0,0.48) 58% 100%)",
          maskImage:       "linear-gradient(to right, black 0% 58%, rgba(0,0,0,0.48) 58% 100%)",
        }}
      >
        <Image
          src="/images/mecca-background.jpg"
          alt=""
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center 30%" }}
        />
      </div>

      {/* Full-page gold geometric pattern — fixed behind everything */}
      <IslamicBackground />

      {/* Vertical ornamental divider between card and form columns */}
      <VerticalDivider />

      <div
        className="nusuk-auth-layout grid min-h-screen"
        style={{
          direction:           "rtl",
          gridTemplateColumns: "42fr 58fr",
          /* Transparent — white comes from <body>, SVG pattern sits between */
          background:          "transparent",
          position:            "relative",
          zIndex:              2,
        }}
      >
        {/* ════ FORM PANEL — right in RTL ════ */}
        <div
          className="nusuk-form-panel relative flex items-center justify-center px-12 py-14"
          style={{ background: "transparent" }}
        >
          <div
            className="relative z-10 w-full"
            style={{ maxWidth: 320 }}
          >
            {/* ── Official logo ── */}
            <div className="mb-8" style={{ direction: "rtl" }}>

              {/* Logo — first to appear */}
              <div
                className="mb-4"
                style={{ animation: "n-rise .72s cubic-bezier(.23,1,.32,1) .05s both" }}
              >
                <Image
                  src="/images/nusuk-logo.png"
                  alt="بطاقة نُسك"
                  width={152}
                  height={159}
                  style={{
                    height: 162, width: "auto",
                    objectFit: "contain", display: "block",
                  }}
                  priority
                />
              </div>

              {/* Gold divider */}
              <div
                className="mb-5"
                style={{
                  width: 32, height: 2,
                  background: "linear-gradient(90deg,#C9963E,transparent)",
                  borderRadius: 2,
                  animation: "n-fade .5s ease .22s both",
                }}
              />

              {/* System name */}
              <p
                className="mb-7"
                style={{
                  fontSize: 17, fontWeight: 600,
                  color: "#58584F", letterSpacing: ".15px",
                  animation: "n-rise .7s cubic-bezier(.23,1,.32,1) .28s both",
                }}
              >
                مساحة عمل فريق بطاقات نسك
              </p>

              {/* Page heading */}
              <h1
                style={{
                  fontSize: 42, fontWeight: 800,
                  color: "#1A1A17", letterSpacing: "-1px",
                  lineHeight: 1.15, textWrap: "balance",
                  marginBottom: 10,
                  animation: "n-rise .75s cubic-bezier(.23,1,.32,1) .36s both",
                }}
              >
                مرحباً بك
              </h1>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: 13, color: "#9A9A90",
                  lineHeight: 1.65, fontWeight: 400,
                  animation: "n-rise .7s cubic-bezier(.23,1,.32,1) .44s both",
                }}
              >
                سجّل دخولك للوصول إلى لوحة التحكم
              </p>
            </div>

            {/* ── Login form — appears last ── */}
            <div style={{ animation: "n-rise .8s cubic-bezier(.23,1,.32,1) .54s both" }}>
              <LoginForm />
            </div>
          </div>
        </div>

        {/* ════ CARD PANEL — left in RTL ════ */}
        <div
          className="nusuk-brand-panel relative flex items-start justify-center overflow-visible"
          style={{
            background: "transparent",
            animation:  "n-rise .9s var(--n-ease-out) both",
            paddingTop: "0",
          }}
        >
          <CardShowcase>
            <TypewriterTagline />
          </CardShowcase>
        </div>
      </div>
    </>
  );
}
