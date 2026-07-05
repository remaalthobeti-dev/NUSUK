/*
  Vertical ornamental divider between the card column (58fr, left)
  and the login-form column (42fr, right) in the RTL two-column layout.
  Fixed position at left: 58% = the exact column boundary.

  Structure:
    ─ gradient vertical line (fades at top & bottom)
    ─ small diamonds at 10%, 30%, 70%, 90%
    ─ large Islamic star medallion at 50%
  All elements share the warm-gold colour and low opacity (~20%).
  Hidden automatically below 860px via .nusuk-divider CSS class.
*/

// ── Helpers ──────────────────────────────────────────────────────────────

function Diamond({ half = 5, opacity = 0.22 }: { half?: number; opacity?: number }) {
  const w = half, h = half * 1.55;
  return (
    <svg
      width={w * 2 + 2}
      height={h * 2 + 2}
      style={{ display: "block" }}
    >
      <path
        d={`M${w + 1},1 L${w * 2 + 1},${h + 1} L${w + 1},${h * 2 + 1} L1,${h + 1}Z`}
        fill="none"
        stroke="#A87228"
        strokeWidth={0.9}
        opacity={opacity}
      />
      <circle
        cx={w + 1} cy={h + 1} r={w * 0.22}
        fill="#A87228"
        opacity={opacity}
      />
    </svg>
  );
}

function StarMedallion({ opacity = 0.22 }: { opacity?: number }) {
  // Three concentric 8-pointed stars + rings — same style as corner ornaments
  function star8(R: number, r: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 16; i++) {
      const a   = (i * Math.PI) / 8 - Math.PI / 2;
      const rad = i % 2 === 0 ? R : r;
      pts.push(`${+(Math.cos(a) * rad).toFixed(2)},${+(Math.sin(a) * rad).toFixed(2)}`);
    }
    return `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(" ")}Z`;
  }

  // Scalloped ring: N outward-bowing arcs
  function scallop(N: number, R: number, bulge: number): string {
    let d = "";
    for (let i = 0; i < N; i++) {
      const a1 = (i * 2 * Math.PI) / N - Math.PI / 2;
      const a2 = ((i + 1) * 2 * Math.PI) / N - Math.PI / 2;
      const am = (a1 + a2) / 2;
      const x1 = +(Math.cos(a1) * R).toFixed(2), y1 = +(Math.sin(a1) * R).toFixed(2);
      const x2 = +(Math.cos(a2) * R).toFixed(2), y2 = +(Math.sin(a2) * R).toFixed(2);
      const qx = +(Math.cos(am) * R * bulge).toFixed(2);
      const qy = +(Math.sin(am) * R * bulge).toFixed(2);
      d += `M${x1},${y1} Q${qx},${qy} ${x2},${y2} `;
    }
    return d.trim();
  }

  return (
    <svg width={68} height={68} viewBox="-34 -34 68 68" style={{ display: "block" }}>
      <g stroke="#A87228" fill="none" opacity={opacity}>
        {/* Outer ring + 12-lobe scallop */}
        <circle r={30} strokeWidth={0.7} />
        <path d={scallop(12, 29, 1.065)} strokeWidth={0.5} />

        {/* 8-pointed outer star */}
        <path d={star8(27, 11)} strokeWidth={1.05} />

        {/* Mid ring + 8-lobe scallop */}
        <circle r={17} strokeWidth={0.6} />
        <path d={scallop(8, 16, 1.07)} strokeWidth={0.45} />

        {/* 8-pointed inner star */}
        <path d={star8(14, 5.5)} strokeWidth={0.9} />

        {/* Centre */}
        <circle r={4.5} strokeWidth={0.55} />
        <circle r={1.8} strokeWidth={0.45} />
      </g>
    </svg>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────

export function VerticalDivider() {
  const ornaments: { top: string; type: "sm" | "md" | "lg" }[] = [
    { top: "8%",  type: "sm" },
    { top: "28%", type: "md" },
    { top: "50%", type: "lg" },
    { top: "72%", type: "md" },
    { top: "92%", type: "sm" },
  ];

  return (
    <div
      className="nusuk-divider"
      style={{
        position:      "fixed",
        top:           0,
        left:          "58%",
        transform:     "translateX(-50%)",
        width:         48,
        height:        "100vh",
        zIndex:        1,
        pointerEvents: "none",
      }}
    >
      {/* Gradient vertical line */}
      <div
        style={{
          position:   "absolute",
          left:       "50%",
          transform:  "translateX(-50%)",
          width:      1,
          top:        "5%",
          bottom:     "5%",
          background: "linear-gradient(to bottom, transparent, #A87228 15%, #A87228 85%, transparent)",
          opacity:    0.22,
        }}
      />

      {/* Ornamental nodes */}
      {ornaments.map(({ top, type }, i) => (
        <div
          key={i}
          style={{
            position:  "absolute",
            top,
            left:      "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {type === "lg" && <StarMedallion />}
          {type === "md" && <Diamond half={6} opacity={0.24} />}
          {type === "sm" && <Diamond half={4} opacity={0.20} />}
        </div>
      ))}
    </div>
  );
}
