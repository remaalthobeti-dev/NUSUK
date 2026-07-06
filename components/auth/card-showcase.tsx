"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const CARD_SRC = "/images/nusuk-card.png";
const CARD_W   = 477;
const CARD_H   = 687;

const STYLES = `
  /*
    Diagonal mask-position sweep — the gradient edge travels in one
    continuous movement from top-right to bottom-left with no stops.
    mask-position interpolation is perfectly linear so there is no
    mid-animation pause.
  */
  @keyframes mask-sweep {
    from { -webkit-mask-position: -60% -60%; mask-position: -60% -60%; }
    to   { -webkit-mask-position: 160% 160%; mask-position: 160% 160%; }
  }

  /* Subtle colour bloom — desaturated → full colour */
  @keyframes colour-bloom {
    0%   { filter: saturate(0)   brightness(1.25) blur(5px); }
    100% { filter: saturate(1)   brightness(1)    blur(0);   }
  }

  @keyframes card-float {
    0%,100% { transform: translateY(0);    }
    50%     { transform: translateY(-10px); }
  }

  .nk-brush-wrap {
    -webkit-mask-image: linear-gradient(135deg, transparent 42%, black 58%);
    mask-image:         linear-gradient(135deg, transparent 42%, black 58%);
    -webkit-mask-size: 300% 300%;
    mask-size:         300% 300%;
    -webkit-mask-position: -60% -60%;
    mask-position:         -60% -60%;
    animation: mask-sweep 3.0s cubic-bezier(.4,0,.2,1) 0.4s forwards;
  }

  .nk-colour-bloom {
    animation: colour-bloom 3.2s cubic-bezier(.23,1,.32,1) 0.4s both;
  }

  .nk-card-float {
    animation: card-float 6s ease-in-out 4.0s infinite;
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    .nk-brush-wrap   { animation: none; -webkit-mask-image: none; mask-image: none; }
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
