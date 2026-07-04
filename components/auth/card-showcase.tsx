"use client";

import Image from "next/image";
import { useEffect, useRef, useCallback } from "react";

/*
  Official card image path.
  Drop  /public/nusuk-card.png  into the repo and this component
  will render it automatically.  No other change needed.
*/
const CARD_IMAGE_SRC = "/images/nusuk-card.png";

/* ─────────────────────────────────────────────────────────────
   Islamic geometric corner pattern (canvas, fade toward center)
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
  R: number,  r: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a   = (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    const x   = cx + Math.cos(a) * rad;
    const y   = cy + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

/* ─────────────────────────────────────────────────────────────
   Official card with lanyard — image-based
   Scale ≈ 85% of original mockup card size for a more elegant look
───────────────────────────────────────────────────────────── */
const CARD_W = 212; // px — ~85% of 248
const CARD_H = 298; // px — ~85% of 350

function OfficialCard({
  cardRef,
}: {
  cardRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={cardRef}
      style={{
        position: "relative",
        width:    CARD_W,
        height:   CARD_H,
        /* Subtle natural hanging shadow — no harsh outlines */
        filter:
          "drop-shadow(0 6px 16px rgba(0,0,0,.18)) " +
          "drop-shadow(0 18px 40px rgba(0,0,0,.14)) " +
          "drop-shadow(0 2px 4px rgba(0,0,0,.08))",
        animation:    "n-float 5.8s ease-in-out infinite",
        borderRadius: 14,
        overflow:     "hidden",
      }}
    >
      <Image
        src={CARD_IMAGE_SRC}
        alt="بطاقة نُسك الرسمية"
        fill
        sizes={`${CARD_W}px`}
        style={{ objectFit: "contain" }}
        priority
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────── */
export function CardShowcase({ children }: { children?: React.ReactNode }) {
  const tlRef    = useRef<HTMLCanvasElement>(null);
  const trRef    = useRef<HTMLCanvasElement>(null);
  const blRef    = useRef<HTMLCanvasElement>(null);
  const brRef    = useRef<HTMLCanvasElement>(null);
  const cardFRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useCornerCanvas(tlRef);
  useCornerCanvas(trRef);
  useCornerCanvas(blRef);
  useCornerCanvas(brRef);

  /* Parallax */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const panel = panelRef.current;
    const card  = cardFRef.current;
    if (!panel || !card) return;
    let active = false;
    const onEnter = () => (active = true);
    const onLeave = () => {
      active = false;
      card.style.filter = "";
    };
    const onMove = (e: MouseEvent) => {
      if (!active) return;
      const rect = panel.getBoundingClientRect();
      const nx   = (e.clientX - rect.left) / rect.width  - 0.5;
      const ny   = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `rotateY(${nx * 10}deg) rotateX(${-ny * 7}deg)`;
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

  const cornerBase: React.CSSProperties = {
    position:      "absolute",
    width:         220,
    height:        220,
    pointerEvents: "none",
    zIndex:        0,
  };

  return (
    <div
      ref={panelRef}
      style={{
        position:       "relative",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        width:          "100%",
        height:         "100%",
      }}
    >
      {/* Corner Islamic patterns */}
      <canvas ref={tlRef} style={{ ...cornerBase, top: 0,    left:  0 }} />
      <canvas ref={trRef} style={{ ...cornerBase, top: 0,    right: 0, transform: "scaleX(-1)" }} />
      <canvas ref={blRef} style={{ ...cornerBase, bottom: 0, left:  0, transform: "scaleY(-1)" }} />
      <canvas ref={brRef} style={{ ...cornerBase, bottom: 0, right: 0, transform: "scale(-1)"  }} />

      {/* Card + lanyard */}
      <div
        style={{
          position:  "relative",
          zIndex:    10,
          width:     CARD_W,
          /* extra top space = lanyard visible height above card */
          marginTop: 0,
        }}
      >
        {/* Lanyard — from outside top of viewport */}
        <div
          style={{
            position:       "absolute",
            top:            -9999,
            left:           "50%",
            transform:      "translateX(-50%)",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            height:         9999 + 24, /* reaches the card top */
            zIndex:         5,
            pointerEvents:  "none",
          }}
        >
          {/* Metal clip */}
          <div style={{
            width:        22,
            height:       7,
            background:   "linear-gradient(180deg,#8a6a2e,#b8882e)",
            borderRadius: "3px 3px 2px 2px",
            boxShadow:    "0 2px 5px rgba(0,0,0,.3)",
            flexShrink:   0,
          }} />
          {/* Fabric strap */}
          <div style={{
            flex:         1,
            width:        3.5,
            background:
              "linear-gradient(180deg," +
              "rgba(201,150,62,.25) 0%," +
              "rgba(201,150,62,.58) 28%," +
              "rgba(201,150,62,.44) 65%," +
              "rgba(201,150,62,.76) 100%)",
            borderRadius: 2,
            animation:    "n-strap-sway 6s ease-in-out infinite",
          }} />
          {/* Ring connector */}
          <div style={{
            width:        13,
            height:       13,
            border:       "2.5px solid #b8882e",
            borderRadius: "50%",
            marginBottom: -3,
            flexShrink:   0,
            boxShadow:    "0 2px 5px rgba(0,0,0,.28)",
          }} />
        </div>

        {/* Official card image */}
        <OfficialCard cardRef={cardFRef} />
      </div>

      {/* Tagline — directly below the card, part of the same visual unit */}
      {children}
    </div>
  );
}
