"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const CARD_SRC = "/images/nusuk-card.png";
const CARD_W   = 477;
const CARD_H   = 687;

const STYLES = `
  /*
    Brush-paint reveal: a diagonal wipe (polygon clip-path) sweeps
    from the top-right corner to the bottom-left corner, as if a
    wide brush is laying down the card in one fluid stroke.
  */
  @keyframes brush-reveal {
    0%   { clip-path: polygon(100% 0%, 100% 0%, 100% 0%,  100% 0%); }
    18%  { clip-path: polygon(100% 0%,  60% 0%, 100% 60%,  100% 0%); }
    40%  { clip-path: polygon(100% 0%,   0% 0%, 100% 100%,  100% 0%); }
    62%  { clip-path: polygon(100% 0%,   0% 0%,   0% 100%, 100% 100%); }
    100% { clip-path: polygon(100% 0%,   0% 0%,   0% 100%, 100% 100%); }
  }

  /* Subtle colour bloom — desaturated → full colour */
  @keyframes colour-bloom {
    0%   { filter: saturate(0)   brightness(1.3) blur(6px); }
    55%  { filter: saturate(0.5) brightness(1.1) blur(1px); }
    100% { filter: saturate(1)   brightness(1)   blur(0);   }
  }

  @keyframes card-float {
    0%,100% { transform: translateY(0);    }
    50%     { transform: translateY(-10px); }
  }

  .nk-brush-wrap {
    clip-path: polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%);
    animation: brush-reveal 1.6s cubic-bezier(.4,0,.2,1) 0.3s forwards;
  }

  .nk-colour-bloom {
    animation: colour-bloom 1.9s cubic-bezier(.23,1,.32,1) 0.3s both;
  }

  .nk-card-float {
    animation: card-float 6s ease-in-out 2.4s infinite;
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    .nk-brush-wrap   { animation: none; clip-path: none; }
    .nk-colour-bloom { animation: none; filter: none; }
    .nk-card-float   { animation: none; }
  }
`;

function DrawnCard({ cardRef }: { cardRef: React.Ref<HTMLDivElement> }) {
  return (
    <>
      <style>{STYLES}</style>

      <div
        style={{ position: "relative", width: CARD_W, height: CARD_H, flexShrink: 0 }}
      >
        {/* Float — starts after paint settles */}
        <div
          ref={cardRef}
          className="nk-card-float"
          style={{ width: "100%", height: "100%", position: "relative" }}
        >
          {/* Diagonal brush-stroke reveal */}
          <div className="nk-brush-wrap" style={{ width: "100%", height: "100%" }}>
            {/* Colour bloom on top of the reveal */}
            <div
              className="nk-colour-bloom"
              style={{
                width:  "100%",
                height: "100%",
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
