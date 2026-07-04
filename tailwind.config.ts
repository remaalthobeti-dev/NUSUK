import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      // ─────────────────────────────────────────────
      // NUSUK DESIGN LANGUAGE — all tokens reference
      // CSS custom properties defined in globals.css
      // ─────────────────────────────────────────────
      colors: {
        // shadcn/ui semantic tokens (unchanged)
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── NUSUK Brand palette ──────────────────
        nusuk: {
          // Dark greens — backgrounds, buttons
          deep:    "hsl(var(--n-deep))",      // #081A10
          dark:    "hsl(var(--n-dark))",      // #091F14
          mid:     "hsl(var(--n-mid))",       // #0D2418
          forest:  "hsl(var(--n-forest))",    // #143825
          // Gold — accent, logos, Islamic patterns
          gold:    "hsl(var(--n-gold))",      // #C9963E
          "gold-lt": "hsl(var(--n-gold-lt))", // #DDB25C
          // Ivory — light backgrounds
          ivory:   "hsl(var(--n-ivory))",     // #FAFAF7
          "ivory-2": "hsl(var(--n-ivory-2))", // #F3F1EB
          "ivory-3": "hsl(var(--n-ivory-3))", // #EAE6DC
          // Ink — text hierarchy
          ink:     "hsl(var(--n-ink))",       // #1A1A17
          "ink-2": "hsl(var(--n-ink-2))",     // #58584F
          "ink-3": "hsl(var(--n-ink-3))",     // #9A9A90
          // Status colors
          success: "hsl(var(--n-success))",
          warning: "hsl(var(--n-warning))",
          error:   "hsl(var(--n-error))",
          info:    "hsl(var(--n-info))",
        },
      },

      // ── Border radius scale ──────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Nusuk brand radii
        "n-sm":  "var(--n-radius-sm)",   // 6px
        "n-md":  "var(--n-radius-md)",   // 9px
        "n-lg":  "var(--n-radius-lg)",   // 14px
        "n-xl":  "var(--n-radius-xl)",   // 20px
        "n-2xl": "var(--n-radius-2xl)",  // 28px
      },

      // ── Box shadows ──────────────────────────────
      boxShadow: {
        "n-card": "var(--n-shadow-card)",
        "n-form": "var(--n-shadow-form)",
        "n-btn":  "var(--n-shadow-btn)",
        "n-btn-hover": "var(--n-shadow-btn-hover)",
        "n-input-focus": "0 0 0 3.5px hsl(var(--n-gold) / 0.28)",
      },

      // ── Font families ────────────────────────────
      fontFamily: {
        sans:    ["var(--font-geist-sans)", "Cairo", "Tajawal", "sans-serif"],
        arabic:  ["Cairo", "Tajawal", "sans-serif"],
        display: ["Cairo", "Tajawal", "sans-serif"],
      },

      // ── Font sizes (type scale) ──────────────────
      fontSize: {
        "n-xs":   ["11px",  { lineHeight: "1.5",  letterSpacing: "0.02em" }],
        "n-sm":   ["12px",  { lineHeight: "1.6",  letterSpacing: "0.01em" }],
        "n-base": ["14px",  { lineHeight: "1.6" }],
        "n-md":   ["15px",  { lineHeight: "1.5" }],
        "n-lg":   ["18px",  { lineHeight: "1.4",  fontWeight: "600" }],
        "n-xl":   ["22px",  { lineHeight: "1.3",  fontWeight: "700" }],
        "n-2xl":  ["28px",  { lineHeight: "1.2",  fontWeight: "700" }],
        "n-3xl":  ["36px",  { lineHeight: "1.15", fontWeight: "700" }],
        "n-hero": ["44px",  { lineHeight: "1.1",  fontWeight: "800" }],
      },

      // ── Spacing (extends Tailwind's 4px base) ────
      spacing: {
        "n-1": "4px",
        "n-2": "8px",
        "n-3": "12px",
        "n-4": "16px",
        "n-5": "20px",
        "n-6": "24px",
        "n-8": "32px",
        "n-10": "40px",
        "n-12": "48px",
        "n-16": "64px",
      },

      // ── Breakpoints ──────────────────────────────
      screens: {
        "n-sm":  "480px",
        "n-md":  "768px",
        "n-lg":  "960px",
        "n-xl":  "1280px",
        "n-2xl": "1536px",
      },

      // ── Keyframes ────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        // Nusuk brand animations
        "n-rise": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "n-fade": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "n-float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        "n-float-b": {
          "0%,100%": { transform: "rotate(8deg) translateY(0)" },
          "50%":     { transform: "rotate(8deg) translateY(-4px)" },
        },
        "n-shimmer": {
          from: { transform: "translateX(-120%)" },
          to:   { transform: "translateX(120%)" },
        },
        "n-ripple": {
          to: { transform: "scale(28)", opacity: "0" },
        },
        "n-strap-sway": {
          "0%,100%": { transform: "skewX(0deg)" },
          "25%":     { transform: "skewX(1deg)" },
          "75%":     { transform: "skewX(-1deg)" },
        },
      },

      // ── Animations ───────────────────────────────
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "n-rise":         "n-rise 0.85s var(--n-ease-out) both",
        "n-rise-delay":   "n-rise 0.85s 0.15s var(--n-ease-out) both",
        "n-fade":         "n-fade 0.3s ease both",
        "n-float":        "n-float 5.5s ease-in-out infinite",
        "n-float-b":      "n-float-b 5.5s 0.5s ease-in-out infinite",
        "n-shimmer":      "n-shimmer 0.55s ease forwards",
        "n-ripple":       "n-ripple 0.55s ease forwards",
        "n-strap-sway":   "n-strap-sway 6s ease-in-out infinite",
      },

      // ── Transition durations ─────────────────────
      transitionDuration: {
        "n-fast": "150ms",
        "n-base": "220ms",
        "n-slow": "500ms",
      },

      // ── Transition timing ─────────────────────────
      transitionTimingFunction: {
        "n-out":    "cubic-bezier(.23,1,.32,1)",
        "n-spring": "cubic-bezier(.34,1.56,.64,1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
