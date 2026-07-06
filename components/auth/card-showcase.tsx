"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const CARD_SRC = "/images/nusuk-card.png";
const CARD_W   = 477;
const CARD_H   = 687;

const STYLES = `
  @keyframes card-enter {
    0%   { opacity: 0; transform: translateY(32px) scale(.94); }
    100% { opacity: 1; transform: translateY(0)    scale(1);   }
  }

  @keyframes card-float {
    0%,100% { transform: translateY(0);    }
    50%     { transform: translateY(-10px); }
  }

  .nk-card-enter {
    animation: card-enter 2.2s cubic-bezier(.23,1,.32,1) 0.3s both;
  }

  .nk-card-float {
    animation: card-float 6s ease-in-out 1.6s infinite;
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    .nk-card-enter { animation: none; opacity: 1; }
    .nk-card-float { animation: none; }
  }
`;

function DrawnCard({ cardRef }: { cardRef: React.Ref<HTMLDivElement> }) {
  return (
    <>
      <style>{STYLES}</style>

      {/* Enter once, float forever */}
      <div
        className="nk-card-enter"
        style={{ width: CARD_W, height: CARD_H, flexShrink: 0 }}
      >
        <div
          ref={cardRef}
          className="nk-card-float"
          style={{
            width: "100%", height: "100%",
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
