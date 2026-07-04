"use client";

import Image from "next/image";
import { useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────
   Official images — verified at 469×675 (card) and 152×159 (logo)
───────────────────────────────────────────────────────────── */
const CARD_SRC = "/images/nusuk-card.png";

/*
  Display size: preserve the 469:675 aspect ratio (~0.695).
  Target display width 210px → height = 210 / 0.695 ≈ 302px.
*/
const CARD_DISPLAY_W = 210;
const CARD_DISPLAY_H = 302;

/* ─────────────────────────────────────────────────────────────
   Islamic geometric corner pattern
───────────────────────────────────────────────────────────── */
function useCornerCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
  const draw = useCallback(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const W = (cv.width  = 220);
    const H = (cv.height = 220);
    ctx.clearRect(0, 0, W, H);
    const S = 48;
    ctx.strokeStyle = "#C9963E";
    ctx.lineWidth   = 0.55;
    for (let r = -1; r < H / S + 2; r++) {
      for (let c = -1; c < W / S + 2; c++) {
        const x    = c * S + (r % 2 === 0 ? 0 : S / 2);
        const y    = r * S * 0.866;
        const dist = Math.sqrt(x * x + y * y);
        if (dist > 230) continue;
        ctx.globalAlpha = Math.max(0, (1 - dist / 200) * 0.32);
        drawStar8(ctx, x, y, S * 0.3, S * 0.12);
      }
    }
    ctx.globalAlpha = 1;
  }, [ref]);
  useEffect(() => { draw(); }, [draw]);
}

function drawStar8(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  R: number, r: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a   = (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    i === 0
      ? ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
      : ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.stroke();
}

/* ─────────────────────────────────────────────────────────────
   Official card — unmodified image, correct aspect ratio
───────────────────────────────────────────────────────────── */
function OfficialCard({ cardRef }: { cardRef: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={cardRef}
      style={{
        width:     CARD_DISPLAY_W,
        height:    CARD_DISPLAY_H,
        position:  "relative",
        flexShrink: 0,
        /* Natural hanging shadow — light and soft */
        filter:
          "drop-shadow(0 4px 8px rgba(0,0,0,.12)) " +
          "drop-shadow(0 12px 28px rgba(0,0,0,.13)) " +
          "drop-shadow(0 28px 52px rgba(0,0,0,.10))",
        animation: "n-float 5.8s ease-in-out infinite",
      }}
    >
      <Image
        src={CARD_SRC}
        alt="بطاقة نُسك الرسمية"
        width={469}
        height={675}
        style={{
          width:     "100%",
          height:    "100%",
          objectFit: "contain",
          display:   "block",
        }}
        priority
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CardShowcase — full brand panel content
───────────────────────────────────────────────────────────── */
export function CardShowcase({ children }: { children?: React.ReactNode }) {
  const tlRef    = useRef<HTMLCanvasElement>(null);
  const trRef    = useRef<HTMLCanvasElement>(null);
  const blRef    = useRef<HTMLCanvasElement>(null);
  const brRef    = useRef<HTMLCanvasElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useCornerCanvas(tlRef);
  useCornerCanvas(trRef);
  useCornerCanvas(blRef);
  useCornerCanvas(brRef);

  /* Subtle parallax tilt on mouse move */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const panel = panelRef.current;
    const card  = cardRef.current;
    if (!panel || !card) return;

    let active = false;
    const onEnter = () => (active = true);
    const onLeave = () => {
      active = false;
      card.style.transform = "";
    };
    const onMove = (e: MouseEvent) => {
      if (!active) return;
      const r  = panel.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - 0.5;
      const ny = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `rotateY(${nx * 8}deg) rotateX(${-ny * 6}deg)`;
    };

    panel.addEventListener("mouseenter", onEnter);
    panel.addEventListener("mouseleave", onLeave);
    panel.addEventListener("mousemove",  onMove);
    return () => {
      panel.removeEventListener("mouseenter", onEnter);
      panel.removeEventListener("mouseleave", onLeave);
      panel.removeEventListener("mousemove",  onMove);
    };
  }, []);

  const corner: React.CSSProperties = {
    position: "absolute", width: 220, height: 220, pointerEvents: "none", zIndex: 0,
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Corner Islamic patterns */}
      <canvas ref={tlRef} style={{ ...corner, top: 0,    left:  0 }} />
      <canvas ref={trRef} style={{ ...corner, top: 0,    right: 0, transform: "scaleX(-1)" }} />
      <canvas ref={blRef} style={{ ...corner, bottom: 0, left:  0, transform: "scaleY(-1)" }} />
      <canvas ref={brRef} style={{ ...corner, bottom: 0, right: 0, transform: "scale(-1)"  }} />

      {/* Card + lanyard wrapper */}
      <div style={{ position: "relative", zIndex: 10, width: CARD_DISPLAY_W }}>

        {/* Lanyard — starts outside top of viewport, ends at card top */}
        <div
          aria-hidden
          style={{
            position:      "absolute",
            top:           -9999,
            left:          "50%",
            transform:     "translateX(-50%)",
            display:       "flex",
            flexDirection: "column",
            alignItems:    "center",
            height:        9999 + 16,
            zIndex:        5,
            pointerEvents: "none",
          }}
        >
          {/* Metal clip at top */}
          <div style={{
            width: 22, height: 7, flexShrink: 0,
            background:   "linear-gradient(180deg,#8a6a2e,#b8882e)",
            borderRadius: "3px 3px 2px 2px",
            boxShadow:    "0 2px 5px rgba(0,0,0,.28)",
          }} />
          {/* Fabric strap */}
          <div style={{
            flex: 1, width: 3.5,
            background:
              "linear-gradient(180deg," +
              "rgba(201,150,62,.22) 0%," +
              "rgba(201,150,62,.55) 30%," +
              "rgba(201,150,62,.42) 65%," +
              "rgba(201,150,62,.72) 100%)",
            borderRadius: 2,
            animation: "n-strap-sway 6s ease-in-out infinite",
          }} />
          {/* Ring connector */}
          <div style={{
            width: 12, height: 12, flexShrink: 0,
            border:       "2.5px solid #b8882e",
            borderRadius: "50%",
            marginBottom: -2,
            boxShadow:    "0 2px 5px rgba(0,0,0,.25)",
          }} />
        </div>

        {/* Official card image — unmodified */}
        <OfficialCard cardRef={cardRef} />
      </div>

      {/* Tagline sits directly below the card */}
      {children}
    </div>
  );
}
