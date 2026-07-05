"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const CARD_SRC = "/images/nusuk-card.png";
const CARD_W   = 477;
const CARD_H   = 687;

/* ── Keyframes injected once ─────────────────────────────────── */
const STYLES = `
  @keyframes card-unveil {
    0%   {
      opacity: 0;
      transform: translateY(-28px) scale(.96);
      -webkit-mask-position: 0 -100%;
      mask-position: 0 -100%;
    }
    30%  { opacity: 1; }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      -webkit-mask-position: 0 0%;
      mask-position: 0 0%;
    }
  }

  @keyframes n-float {
    0%, 100% { transform: translateY(0px);   }
    50%       { transform: translateY(-10px); }
  }

  .card-reveal {
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent    0%,
      black         28%,
      black        100%
    );
    mask-image: linear-gradient(
      to bottom,
      transparent    0%,
      black         28%,
      black        100%
    );
    -webkit-mask-size: 100% 200%;
    mask-size: 100% 200%;
    animation: card-unveil 1.1s cubic-bezier(.23,1,.32,1) .2s both;
  }

  .card-float {
    animation: n-float 6s ease-in-out infinite;
    will-change: transform;
  }
`;

function OfficialCard({ cardRef }: { cardRef: React.Ref<HTMLDivElement> }) {
  return (
    <>
      <style>{STYLES}</style>

      {/* Reveal wrapper — mask sweeps top-to-bottom */}
      <div
        className="card-reveal"
        style={{
          width:      CARD_W,
          height:     CARD_H,
          flexShrink: 0,
        }}
      >
        {/* Float wrapper — separates float from reveal so both play cleanly */}
        <div
          ref={cardRef}
          className="card-float"
          style={{
            width:    "100%",
            height:   "100%",
            position: "relative",
            filter:
              "drop-shadow(0 2px 6px rgba(0,0,0,.18)) " +
              "drop-shadow(0 12px 28px rgba(0,0,0,.20)) " +
              "drop-shadow(0 36px 64px rgba(0,0,0,.14))",
          }}
        >
          <Image
            src={CARD_SRC}
            alt="بطاقة نُسك الرسمية"
            width={469}
            height={675}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            quality={100}
            priority
          />
        </div>
      </div>
    </>
  );
}

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
      {children}
    </div>
  );
}
