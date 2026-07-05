/*
  Two large Islamic arabesque medallions — one at each opposite corner.
  Each medallion has 10 concentric layers: scalloped rings, multi-pointed
  stars, and almond-petal rings — the vocabulary of mosque decorative art.
  Only the inward quadrant of each medallion is in-viewport.

  No hooks, no browser APIs — Server Component safe.
  Layer z-index: white <body> (0) → this SVG (1) → page content (2).
*/

// ── Helpers ──────────────────────────────────────────────────────────────

/** N-pointed star, 2N alternating vertices at radii R and r. */
function starPath(
  N: number, R: number, r: number,
  cx: number, cy: number,
  rot = -Math.PI / 2,
): string {
  const pts: string[] = [];
  for (let i = 0; i < 2 * N; i++) {
    const a   = (i * Math.PI) / N + rot;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${+(cx + Math.cos(a) * rad).toFixed(2)},${+(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(" ")}Z`;
}

/** N almond-shaped petals arranged radially at radius R from (cx,cy). */
function petalRing(
  N: number, R: number, len: number, wid: number,
  cx: number, cy: number,
): string {
  let d = "";
  for (let i = 0; i < N; i++) {
    const a  = (i * 2 * Math.PI) / N - Math.PI / 2;
    const px = cx + Math.cos(a) * R;
    const py = cy + Math.sin(a) * R;
    const c  = Math.cos(a), s  = Math.sin(a);        // radial direction
    const p  = Math.cos(a + Math.PI / 2);             // perpendicular
    const q  = Math.sin(a + Math.PI / 2);
    const hl = len / 2, hw = wid / 2;
    // outer tip, inner tip
    const t1x = +(px + c * hl).toFixed(2), t1y = +(py + s * hl).toFixed(2);
    const t2x = +(px - c * hl).toFixed(2), t2y = +(py - s * hl).toFixed(2);
    // control points (Bezier curves bulge sideways)
    const cp  = (v: number) => +v.toFixed(2);
    d += `M${t1x},${t1y}`;
    d += `C${cp(px+c*hl*0.15+p*hw)},${cp(py+s*hl*0.15+q*hw)}`;
    d += ` ${cp(px-c*hl*0.15+p*hw)},${cp(py-s*hl*0.15+q*hw)} ${t2x},${t2y}`;
    d += `C${cp(px-c*hl*0.15-p*hw)},${cp(py-s*hl*0.15-q*hw)}`;
    d += ` ${cp(px+c*hl*0.15-p*hw)},${cp(py+s*hl*0.15-q*hw)} ${t1x},${t1y}Z `;
  }
  return d.trim();
}

/** N quadratic-Bezier arcs forming a scalloped / lobed ring at radius R. */
function scallopRing(N: number, R: number, bulge: number, cx: number, cy: number): string {
  let d = "";
  for (let i = 0; i < N; i++) {
    const a1   = (i * 2 * Math.PI) / N - Math.PI / 2;
    const a2   = ((i + 1) * 2 * Math.PI) / N - Math.PI / 2;
    const aMid = (a1 + a2) / 2;
    const x1 = +(cx + Math.cos(a1) * R).toFixed(2);
    const y1 = +(cy + Math.sin(a1) * R).toFixed(2);
    const x2 = +(cx + Math.cos(a2) * R).toFixed(2);
    const y2 = +(cy + Math.sin(a2) * R).toFixed(2);
    // Control point pushed outward beyond R
    const qx = +(cx + Math.cos(aMid) * R * bulge).toFixed(2);
    const qy = +(cy + Math.sin(aMid) * R * bulge).toFixed(2);
    d += `M${x1},${y1} Q${qx},${qy} ${x2},${y2} `;
  }
  return d.trim();
}

// ── Medallion ─────────────────────────────────────────────────────────────

function Arabesque({ cx, cy }: { cx: number; cy: number }) {
  const S = "#A87228"; // warmer, deeper gold — more visible on white
  return (
    <g stroke={S} fill="none">

      {/* ① Outermost boundary circle */}
      <circle cx={cx} cy={cy} r={268} strokeWidth={1.1} />

      {/* ② 16-lobe scalloped outer ring */}
      <path d={scallopRing(16, 262, 1.055, cx, cy)} strokeWidth={0.85} />

      {/* ③ 16-pointed star — the main geometric web */}
      <path d={starPath(16, 255, 103, cx, cy)} strokeWidth={1.55} />

      {/* ④ Outer petal ring — 16 long almond petals */}
      <path d={petalRing(16, 204, 92, 28, cx, cy)} strokeWidth={1.15} />

      {/* ⑤ Mid boundary + 12-lobe scallop */}
      <circle cx={cx} cy={cy} r={172} strokeWidth={0.9} />
      <path d={scallopRing(12, 167, 1.06, cx, cy)} strokeWidth={0.72} />

      {/* ⑥ 12-pointed star */}
      <path d={starPath(12, 162, 66, cx, cy)} strokeWidth={1.35} />

      {/* ⑦ Mid petal ring — 12 petals */}
      <path d={petalRing(12, 132, 72, 24, cx, cy)} strokeWidth={1.05} />

      {/* ⑧ Inner boundary + 8-lobe scallop */}
      <circle cx={cx} cy={cy} r={102} strokeWidth={0.8} />
      <path d={scallopRing(8, 98, 1.07, cx, cy)} strokeWidth={0.65} />

      {/* ⑨ 8-pointed star */}
      <path d={starPath(8, 94, 38, cx, cy)} strokeWidth={1.25} />

      {/* ⑩ Inner petal ring — 8 petals */}
      <path d={petalRing(8, 70, 55, 18, cx, cy)} strokeWidth={1.0} />

      {/* ⑪ Core star + detail circles */}
      <circle cx={cx} cy={cy} r={40} strokeWidth={0.82} />
      <path d={starPath(8, 36, 15, cx, cy)} strokeWidth={1.0} />
      <circle cx={cx} cy={cy} r={18} strokeWidth={0.75} />
      <circle cx={cx} cy={cy} r={8}  strokeWidth={0.65} />
    </g>
  );
}

// ── Export ────────────────────────────────────────────────────────────────

const PANEL: React.CSSProperties = {
  position:      "fixed",
  width:         560,
  height:        560,
  overflow:      "visible",
  pointerEvents: "none",
  zIndex:        1,
  opacity:       0.34,
};

export function IslamicBackground() {
  return (
    <>
      {/* Bottom-right — NW quadrant visible */}
      <svg aria-hidden style={{ ...PANEL, bottom: 0, right: 0 }}>
        <Arabesque cx={560} cy={560} />
      </svg>

      {/* Bottom-left — NE quadrant visible */}
      <svg aria-hidden style={{ ...PANEL, bottom: 0, left: 0 }}>
        <Arabesque cx={0} cy={560} />
      </svg>
    </>
  );
}
