"use client";

import { useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────
   Islamic geometric pattern — 8-pointed stars, drawn in each
   corner of the brand panel. Opacity fades toward the centre.
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

    const S = 48; // tile size
    ctx.strokeStyle = "#C9963E";
    ctx.lineWidth   = 0.55;

    for (let r = -1; r < H / S + 2; r++) {
      for (let c = -1; c < W / S + 2; c++) {
        const x = c * S + (r % 2 === 0 ? 0 : S / 2);
        const y = r * S * 0.866;
        const dist = Math.sqrt(x * x + y * y);
        if (dist > 230) continue;
        ctx.globalAlpha = Math.max(0, (1 - dist / 200) * 0.35);
        drawStar8(ctx, x, y, S * 0.3, S * 0.12);
      }
    }
    ctx.globalAlpha = 1;
  }, [ref]);

  useEffect(() => {
    draw();
  }, [draw]);
}

function drawStar8(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  r: number
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
   Minimal QR-code placeholder — 7×7 pixel grid
───────────────────────────────────────────────────────────── */
const QR_BITS = [
  1,1,1,0,1,0,1,
  1,0,1,0,1,0,1,
  1,1,1,0,0,0,1,
  0,0,0,0,1,0,0,
  1,1,1,0,1,1,1,
  1,0,0,0,0,0,1,
  1,1,1,0,1,1,1,
];

function QRGrid() {
  return (
    <div
      className="grid shrink-0 rounded-[5px] border border-black/8 bg-white p-[5px]"
      style={{ width: 56, height: 56, gridTemplateColumns: "repeat(7,1fr)", gap: 1.5 }}
    >
      {QR_BITS.map((v, i) => (
        <div
          key={i}
          className="rounded-[1px]"
          style={{ background: v ? "#1A1A17" : "transparent" }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Nusuk Card — front face
───────────────────────────────────────────────────────────── */
function CardFront({ cardRef }: { cardRef: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={cardRef}
      id="card-front"
      className="absolute right-0 top-0 z-[2] flex flex-col overflow-hidden rounded-[15px]"
      style={{
        width: 248,
        height: 350,
        transform: "rotate(-2.5deg)",
        border: "1px solid rgba(201,150,62,.2)",
        background: "linear-gradient(168deg,#FFFEFC 0%,#F7F4EB 100%)",
        boxShadow:
          "0 2px 4px rgba(0,0,0,.08),0 8px 20px rgba(0,0,0,.18),0 28px 60px rgba(0,0,0,.28),0 0 0 .5px rgba(201,150,62,.12)",
        animation: "n-float 5.5s ease-in-out infinite",
      }}
    >
      {/* Header strip */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3"
        style={{
          background: "linear-gradient(105deg,#091F14 0%,#143825 60%,#1A3A22 100%)",
        }}
      >
        <div className="text-right">
          <p
            className="font-bold"
            style={{ fontSize: 10, color: "rgba(201,150,62,.95)", letterSpacing: ".3px" }}
          >
            بطاقة نُسك
          </p>
          <p
            style={{
              fontSize: 6.5,
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "rgba(201,150,62,.5)",
              marginTop: 1.5,
              direction: "ltr",
            }}
          >
            NUSUK CARD
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Stacked-books logo mark */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="14" width="18" height="4" rx="1.5" fill="rgba(201,150,62,.7)" />
            <rect x="5" y="9"  width="14" height="4" rx="1.5" fill="rgba(201,150,62,.55)" />
            <rect x="7" y="4"  width="10" height="4" rx="1.5" fill="rgba(201,150,62,.4)" />
          </svg>
          <span style={{ fontSize: 7, color: "rgba(201,150,62,.45)", direction: "ltr" }}>
            ١٤٤٦ / ٢٠٢٥
          </span>
        </div>
      </div>

      {/* Gold accent bar */}
      <div
        style={{
          height: 2,
          background:
            "linear-gradient(90deg,rgba(201,150,62,.06),rgba(201,150,62,.65),rgba(201,150,62,.06))",
          flexShrink: 0,
        }}
      />

      {/* Body */}
      <div className="flex flex-1 flex-col gap-[11px] px-[15px] py-[13px]">
        {/* Photo + name */}
        <div className="flex items-start gap-[11px]">
          <div
            className="shrink-0 rounded-[7px]"
            style={{
              width: 58,
              height: 70,
              background: "linear-gradient(145deg,#E8E3D5,#CFC8B5)",
              border: "1px solid rgba(201,150,62,.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
              <circle cx="15" cy="12" r="9" fill="#BFB9AC" />
              <path d="M0 38c0-9.389 6.716-17 15-17s15 7.611 15 17" fill="#BFB9AC" />
            </svg>
          </div>
          <div className="flex-1 text-right" style={{ direction: "rtl" }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: "#1A1A17", lineHeight: 1.5 }}>
              محمد أحمد عبدالله
            </p>
            <p style={{ fontSize: 7.5, color: "#6B6B60", marginTop: 2, direction: "ltr", textAlign: "right" }}>
              Mohammed Ahmed Abdullah
            </p>
            <p style={{ fontSize: 6.5, color: "#9A9A90", marginTop: 1, direction: "ltr", textAlign: "right" }}>
              المملكة العربية السعودية
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 0.5,
            background:
              "linear-gradient(90deg,transparent,rgba(201,150,62,.4),transparent)",
          }}
        />

        {/* QR + fields */}
        <div className="flex items-start gap-[10px]">
          <QRGrid />
          <div
            className="flex flex-1 flex-col gap-[7px] text-right"
            style={{ direction: "rtl" }}
          >
            {[
              { label: "رقم الهوية | ID",       value: "1000123456789" },
              { label: "تاريخ الميلاد | DOBB",  value: "1990 / 12 / 08" },
              { label: "رقم الإسناد | PID",     value: "Y000123456789" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col gap-[1px]">
                <span style={{ fontSize: 5.5, color: "#9A9A90", letterSpacing: ".5px" }}>
                  {f.label}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: "#1A1A17",
                    direction: "ltr",
                    textAlign: "right",
                  }}
                >
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex shrink-0 items-center justify-between px-[15px] py-[8px]"
        style={{
          background:
            "linear-gradient(90deg,rgba(201,150,62,.03),rgba(201,150,62,.09))",
          borderTop: "1px solid rgba(201,150,62,.16)",
        }}
      >
        <div
          className="text-right"
          style={{ direction: "rtl", lineHeight: 1.5 }}
        >
          <p style={{ fontSize: 6.5, fontWeight: 600, color: "#58584F" }}>
            شركة خدمات الحج
          </p>
          <p style={{ fontSize: 5.5, color: "#9A9A90", fontWeight: 400 }}>
            Hajj Services Company
          </p>
        </div>
        <div className="text-left" style={{ direction: "ltr" }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: "#C9963E" }}>1966</p>
          <p style={{ fontSize: 5, color: "#9A9A90" }}>Card Serial No.</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Card back
───────────────────────────────────────────────────────────── */
function CardBack() {
  return (
    <div
      className="absolute z-[1] flex items-center justify-center overflow-hidden rounded-[15px]"
      style={{
        width: 248,
        height: 350,
        right: 26,
        top: 10,
        transform: "rotate(8deg)",
        background: "linear-gradient(150deg,#F0EDE3,#E5E0D0)",
        boxShadow:
          "0 2px 4px rgba(0,0,0,.07),0 8px 20px rgba(0,0,0,.14),0 24px 48px rgba(0,0,0,.2)",
        animation: "n-float-b 5.5s .5s ease-in-out infinite",
      }}
    >
      <div className="flex flex-col items-center gap-2 opacity-15">
        <span style={{ fontSize: 30, fontWeight: 800, color: "#4a3a1a", letterSpacing: -1 }}>
          نسك
        </span>
        <span
          style={{
            fontSize: 8,
            letterSpacing: "2.5px",
            fontWeight: 600,
            color: "#4a3a1a",
            textTransform: "uppercase",
          }}
        >
          NUSUK
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main export — full card showcase with lanyard + parallax
───────────────────────────────────────────────────────────── */
export function CardShowcase() {
  const tlRef = useRef<HTMLCanvasElement>(null);
  const trRef = useRef<HTMLCanvasElement>(null);
  const blRef = useRef<HTMLCanvasElement>(null);
  const brRef = useRef<HTMLCanvasElement>(null);
  const cardFRef = useRef<HTMLDivElement>(null);
  const cardBRef = useRef<HTMLDivElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  useCornerCanvas(tlRef);
  useCornerCanvas(trRef);
  useCornerCanvas(blRef);
  useCornerCanvas(brRef);

  /* Parallax on mouse move */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const panel = panelRef.current;
    const cf    = cardFRef.current;
    const cb    = cardBRef.current;
    if (!panel || !cf || !cb) return;

    let active = false;

    const onEnter = () => (active = true);
    const onLeave = () => {
      active = false;
      cf.style.transform = "";
      cb.style.transform = "";
    };
    const onMove = (e: MouseEvent) => {
      if (!active) return;
      const r  = panel.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - 0.5;
      const ny = (e.clientY - r.top)  / r.height - 0.5;
      cf.style.transform = `rotate(-2.5deg) rotateY(${nx * 10}deg) rotateX(${-ny * 7}deg)`;
      cb.style.transform = `rotate(8deg)   rotateY(${nx * 6}deg)  rotateX(${-ny * 4}deg)`;
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
    position: "absolute",
    width:  220,
    height: 220,
    pointerEvents: "none",
    zIndex: 0,
  };

  return (
    <div
      ref={panelRef}
      className="relative flex flex-col items-center justify-center"
      style={{ minHeight: "100%", width: "100%" }}
    >
      {/* Corner Islamic patterns */}
      <canvas ref={tlRef} style={{ ...cornerBase, top: 0, left: 0 }} />
      <canvas ref={trRef} style={{ ...cornerBase, top: 0, right: 0, transform: "scaleX(-1)" }} />
      <canvas ref={blRef} style={{ ...cornerBase, bottom: 0, left: 0, transform: "scaleY(-1)" }} />
      <canvas ref={brRef} style={{ ...cornerBase, bottom: 0, right: 0, transform: "scale(-1)" }} />

      {/* Card showcase */}
      <div className="relative z-10" style={{ width: 280, height: 390 }}>
        {/* Lanyard — extends upward out of this container via overflow visible */}
        <div
          className="absolute left-1/2 z-[5] flex -translate-x-1/2 flex-col items-center"
          style={{ top: -999, height: 999 + 80 }}
        >
          {/* Hook clip */}
          <div
            style={{
              width: 24,
              height: 8,
              background: "linear-gradient(180deg,#8a6a2e,#b8882e)",
              borderRadius: "4px 4px 2px 2px",
              boxShadow: "0 2px 6px rgba(0,0,0,.35)",
              flexShrink: 0,
            }}
          />
          {/* Strap */}
          <div
            style={{
              flex: 1,
              width: 4,
              background:
                "linear-gradient(180deg,rgba(201,150,62,.28) 0%,rgba(201,150,62,.62) 30%,rgba(201,150,62,.48) 70%,rgba(201,150,62,.82) 100%)",
              borderRadius: 2,
              boxShadow: "0 0 8px rgba(201,150,62,.1)",
              animation: "n-strap-sway 6s ease-in-out infinite",
            }}
          />
          {/* Ring */}
          <div
            style={{
              width: 14,
              height: 14,
              border: "2.5px solid #b8882e",
              borderRadius: "50%",
              marginBottom: -4,
              boxShadow: "0 2px 6px rgba(0,0,0,.35)",
              flexShrink: 0,
            }}
          />
        </div>

        <CardBack />
        <CardFront cardRef={cardFRef} />
      </div>
    </div>
  );
}
