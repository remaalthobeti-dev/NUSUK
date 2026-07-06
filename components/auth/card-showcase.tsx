"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const CARD_SRC = "/images/nusuk-card.png";
const CARD_W   = 477;
const CARD_H   = 687;
const R        = 30; // card corner radius

// Perimeter of the rounded-rect path (used for stroke-dasharray)
const PERIM = Math.round(2 * (CARD_W + CARD_H) - (8 - 2 * Math.PI) * R);
// ≈ 2328 − 41 = 2287

const STYLES = `
  /* ── 1. Pen draws the outline ── */
  @keyframes draw-stroke {
    from { stroke-dashoffset: ${PERIM}; }
    to   { stroke-dashoffset: 0; }
  }

  /* ── 2. Outline fades after drawing ── */
  @keyframes stroke-fade {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* ── 3. Card materialises from ghost to solid ── */
  @keyframes card-materialise {
    0%   { opacity: 0;   filter: blur(10px) saturate(0) brightness(1.4); }
    45%  { opacity: 0.3; filter: blur(4px)  saturate(0.2) brightness(1.1); }
    100% { opacity: 1;   filter: blur(0)    saturate(1)   brightness(1); }
  }

  /* ── 4. Glow pulse on the outline while drawing ── */
  @keyframes glow-pulse {
    0%,100% { filter: drop-shadow(0 0 0px rgba(201,150,62,0));   }
    50%     { filter: drop-shadow(0 0 12px rgba(201,150,62,.7));  }
  }

  /* ── 5. Steady float once everything settles ── */
  @keyframes card-float {
    0%,100% { transform: translateY(0);   }
    50%     { transform: translateY(-10px); }
  }

  .nk-draw-svg {
    position: absolute;
    inset: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    pointer-events: none;
    z-index: 3;
    overflow: visible;
  }

  .nk-draw-path {
    fill: none;
    stroke: #C9963E;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: ${PERIM};
    stroke-dashoffset: ${PERIM};
    animation:
      draw-stroke  2.0s cubic-bezier(.4,0,.15,1) 0.35s forwards,
      glow-pulse   2.0s ease                     0.35s,
      stroke-fade  0.5s ease                     2.1s  forwards;
  }

  /* Pen-tip dot that rides at the leading edge of the stroke */
  .nk-pen-dot {
    r: 4;
    fill: #C9963E;
    filter: drop-shadow(0 0 5px rgba(201,150,62,.9));
    opacity: 0;
    animation: stroke-fade 0.4s ease 2.0s forwards reverse;
  }

  .nk-card-img {
    animation: card-materialise 1.8s cubic-bezier(.23,1,.32,1) 0.95s both;
  }

  .nk-card-float {
    animation: card-float 6s ease-in-out 3.0s infinite;
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    .nk-draw-path  { animation: none; stroke-dashoffset: 0; opacity: 0; }
    .nk-pen-dot    { display: none; }
    .nk-card-img   { animation: none; opacity: 1; filter: none; }
    .nk-card-float { animation: none; }
  }
`;

/* ── Rounded-rect SVG path (clockwise from top-left arc) ────────── */
const cardPath =
  `M ${R},0 L ${CARD_W - R},0 Q ${CARD_W},0 ${CARD_W},${R} ` +
  `L ${CARD_W},${CARD_H - R} Q ${CARD_W},${CARD_H} ${CARD_W - R},${CARD_H} ` +
  `L ${R},${CARD_H} Q 0,${CARD_H} 0,${CARD_H - R} ` +
  `L 0,${R} Q 0,0 ${R},0 Z`;

function DrawnCard({ cardRef }: { cardRef: React.Ref<HTMLDivElement> }) {
  return (
    <>
      <style>{STYLES}</style>

      <div
        style={{
          position: "relative",
          width:     CARD_W,
          height:    CARD_H,
          flexShrink: 0,
        }}
      >
        {/* ── Floating wrapper (starts after draw settles) ── */}
        <div
          ref={cardRef}
          className="nk-card-float"
          style={{ width: "100%", height: "100%", position: "relative" }}
        >
          {/* Card image — materialises while pen draws */}
          <div
            className="nk-card-img"
            style={{
              width: "100%", height: "100%", position: "relative",
              filter:
                "drop-shadow(0 2px 6px rgba(0,0,0,.18)) " +
                "drop-shadow(0 12px 28px rgba(0,0,0,.20)) " +
                "drop-shadow(0 36px 64px rgba(0,0,0,.14))",
            }}
          >
            <Image
              src={CARD_SRC}
              alt="بطاقة نُسك الرسمية"
              width={CARD_W}
              height={CARD_H}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              quality={100}
              priority
            />
          </div>
        </div>

        {/* ── SVG pen stroke (sits above the card) ── */}
        <svg
          className="nk-draw-svg"
          viewBox={`0 0 ${CARD_W} ${CARD_H}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path className="nk-draw-path" d={cardPath} />
        </svg>
      </div>
    </>
  );
}

export function CardShowcase({ children }: { children?: React.ReactNode }) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* 3-D tilt on hover */
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
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        position:       "relative",
        zIndex:         1,
        marginTop:      "-32px",
      }}
    >
      <DrawnCard cardRef={cardRef} />
      {children}
    </div>
  );
}
