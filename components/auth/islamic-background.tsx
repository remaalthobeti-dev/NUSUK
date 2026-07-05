"use client";

/*
  SVG-based Islamic geometric background.
  Layer order: white body → this SVG (z:1) → page content (z:2).

  Pattern: 8-pointed star (two overlapping squares, 22.5° step vertices).
  Star centered at (29,29) in a 58×58 tile.
  CSS mask fades the pattern out toward the centre so only edges show.
*/

const STAR =
  "M29,12 L31.68,22.53 L41.02,16.98 L35.47,26.32 L46,29 " +
  "L35.47,31.68 L41.02,41.02 L31.68,35.47 L29,46 " +
  "L26.32,35.47 L16.98,41.02 L22.53,31.68 L12,29 " +
  "L22.53,26.32 L16.98,16.98 L26.32,22.53 Z";

/* Radial CSS mask: transparent inside → opaque at edges/corners */
const MASK =
  "radial-gradient(ellipse 78% 72% at 50% 50%, " +
  "transparent 0%, transparent 28%, black 68%)";

export function IslamicBackground() {
  return (
    <svg
      aria-hidden
      style={{
        position:              "fixed",
        inset:                 0,
        width:                 "100%",
        height:                "100%",
        pointerEvents:         "none",
        zIndex:                1,
        maskImage:             MASK,
        WebkitMaskImage:       MASK,
      }}
    >
      <defs>
        <pattern
          id="nusuk-star"
          x="0" y="0"
          width="58" height="58"
          patternUnits="userSpaceOnUse"
        >
          <path
            d={STAR}
            fill="none"
            stroke="#C9963E"
            strokeWidth="0.85"
          />
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#nusuk-star)" opacity="0.45" />
    </svg>
  );
}
