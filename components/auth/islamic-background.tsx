"use client";

/*
  Two large Islamic medallion ornaments at opposite corners.
  Only the visible quadrant of each ornament shows — the rest
  is naturally clipped by the viewport edge.

  Layer order: white <body> → this (z:1) → page content (z:2).
*/

function star8Path(R: number, r: number, cx: number, cy: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a   = (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    pts.push(
      `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`,
    );
  }
  return "M " + pts[0] + " " + pts.slice(1).map((p) => "L " + p).join(" ") + " Z";
}

function Medallion({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g stroke="#C9963E" fill="none">
      {/* Outermost ring */}
      <circle cx={cx} cy={cy} r={245} strokeWidth={0.5} />

      {/* Large outer star */}
      <path d={star8Path(228, 92, cx, cy)} strokeWidth={1.0} />

      {/* Spoke lines — outer ring to mid ring */}
      {Array.from({ length: 8 }, (_, i) => {
        const a  = (i * Math.PI) / 4 - Math.PI / 2;
        const x1 = cx + Math.cos(a) * 155;
        const y1 = cy + Math.sin(a) * 155;
        const x2 = cx + Math.cos(a) * 245;
        const y2 = cy + Math.sin(a) * 245;
        return <line key={i} x1={x1.toFixed(2)} y1={y1.toFixed(2)} x2={x2.toFixed(2)} y2={y2.toFixed(2)} strokeWidth={0.35} />;
      })}

      {/* Mid ring */}
      <circle cx={cx} cy={cy} r={155} strokeWidth={0.5} />

      {/* Mid star */}
      <path d={star8Path(148, 60, cx, cy)} strokeWidth={0.85} />

      {/* Spoke lines — inner ring to mid ring */}
      {Array.from({ length: 8 }, (_, i) => {
        const a  = (i * Math.PI) / 4;
        const x1 = cx + Math.cos(a) * 88;
        const y1 = cy + Math.sin(a) * 88;
        const x2 = cx + Math.cos(a) * 155;
        const y2 = cy + Math.sin(a) * 155;
        return <line key={i} x1={x1.toFixed(2)} y1={y1.toFixed(2)} x2={x2.toFixed(2)} y2={y2.toFixed(2)} strokeWidth={0.3} />;
      })}

      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={88} strokeWidth={0.45} />

      {/* Inner star */}
      <path d={star8Path(82, 33, cx, cy)} strokeWidth={0.75} />

      {/* Centre detail */}
      <circle cx={cx} cy={cy} r={28} strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={14} strokeWidth={0.4} />
    </g>
  );
}

const BASE: React.CSSProperties = {
  position:      "fixed",
  width:         450,
  height:        450,
  overflow:      "visible",
  pointerEvents: "none",
  zIndex:        1,
  opacity:       0.09,
};

export function IslamicBackground() {
  return (
    <>
      {/* Top-left — only the SE quadrant of the medallion is in-viewport */}
      <svg aria-hidden style={{ ...BASE, top: 0, left: 0 }}>
        <Medallion cx={0} cy={0} />
      </svg>

      {/* Bottom-right — only the NW quadrant is in-viewport */}
      <svg aria-hidden style={{ ...BASE, bottom: 0, right: 0 }}>
        <Medallion cx={450} cy={450} />
      </svg>
    </>
  );
}
