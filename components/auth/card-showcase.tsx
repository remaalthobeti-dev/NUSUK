"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/*
  Official card: 469 × 675 px (JPEG).
  The image already contains the lanyard — no separate CSS strap needed.
  Size: +15% vs previous 210 × 302 → 242 × 347 px.
*/
const CARD_SRC = "/images/nusuk-card.png";
const CARD_W   = 242;
const CARD_H   = 347;

/* ─────────────────────────────────────────────────────────────
   Official card image — unmodified, natural drop-shadow only
───────────────────────────────────────────────────────────── */
function OfficialCard({ cardRef }: { cardRef: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={cardRef}
      style={{
        width:      CARD_W,
        height:     CARD_H,
        position:   "relative",
        flexShrink: 0,
        /*
          Light, natural hanging shadow — no border, no background,
          no radius. The card image handles its own shape.
        */
        filter:
          "drop-shadow(0 6px 14px rgba(0,0,0,.11)) " +
          "drop-shadow(0 18px 36px rgba(0,0,0,.10)) " +
          "drop-shadow(0 32px 56px rgba(0,0,0,.07))",
        animation: "n-float 5.8s ease-in-out infinite",
      }}
    >
      <Image
        src={CARD_SRC}
        alt="بطاقة نُسك الرسمية"
        width={469}
        height={675}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        priority
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CardShowcase
   • No CSS lanyard (the card image already has one)
   • No corner canvases (moved to IslamicBackground page-level)
   • Subtle parallax tilt on hover
───────────────────────────────────────────────────────────── */
export function CardShowcase({ children }: { children?: React.ReactNode }) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const panel = panelRef.current;
    const card  = cardRef.current;
    if (!panel || !card) return;

    let active = false;
    const onEnter = () => (active = true);
    const onLeave = () => { active = false; card.style.transform = ""; };
    const onMove  = (e: MouseEvent) => {
      if (!active) return;
      const r  = panel.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - 0.5;
      const ny = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `rotateY(${nx * 7}deg) rotateX(${-ny * 5}deg)`;
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

  return (
    <div
      ref={panelRef}
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        position:       "relative",
        zIndex:         1,
      }}
    >
      {/* Official card — image contains its own lanyard */}
      <OfficialCard cardRef={cardRef} />

      {/* Tagline sits directly below with comfortable gap */}
      {children}
    </div>
  );
}
