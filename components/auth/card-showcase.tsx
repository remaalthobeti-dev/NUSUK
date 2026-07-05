"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/*
  Official card: 469 × 675 px (aspect ratio 0.6948) — RGBA transparent PNG.
  Display at 318 × 458 px. drop-shadow() traces the exact card silhouette
  (including lanyard) — no white rect bleed. No CSS strap needed.
  Negative marginTop pushes the lanyard above the viewport top edge.
*/
const CARD_SRC = "/images/nusuk-card.png";
const CARD_W   = 477;
const CARD_H   = 687; // 477 / 0.6948 ≈ 687  (+50% from 318×458)

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
          Three-layer shadow simulates natural depth of a hanging card.
          Very soft — the image itself carries the visual weight.
        */
        filter:
          "drop-shadow(0 2px 4px rgba(0,0,0,.12)) " +
          "drop-shadow(0 10px 24px rgba(0,0,0,.14)) " +
          "drop-shadow(0 30px 56px rgba(0,0,0,.10))",
        animation:    "n-float 6s ease-in-out infinite",
        willChange:   "transform",
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

export function CardShowcase({ children }: { children?: React.ReactNode }) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* Subtle parallax — gentle, not distracting */
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
      /* Restrained tilt — max ±6° horizontal, ±4° vertical */
      card.style.transform = `rotateY(${nx * 6}deg) rotateX(${-ny * 4}deg)`;
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
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        position:      "relative",
        zIndex:        1,
        marginTop:     "-32px",
      }}
    >
      <OfficialCard cardRef={cardRef} />

      {/* Tagline — part of the same visual unit as the card */}
      {children}
    </div>
  );
}
