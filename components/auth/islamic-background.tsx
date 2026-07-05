"use client";

import { useEffect, useRef } from "react";

/*
  Full-page fixed canvas with 8-pointed star Islamic geometric pattern.
  Concentrated near the 4 edges, fading toward the centre — so the
  form and card areas stay clean while the page has visual identity.
  Opacity is intentionally very low (~5%) so it never distracts.
*/

function drawStar8(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  R: number, r: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a   = (i * Math.PI) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    i === 0
      ? ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
      : ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.stroke();
}

export function IslamicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const draw = () => {
      const W = (cv.width  = window.innerWidth);
      const H = (cv.height = window.innerHeight);
      const ctx = cv.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "#C9963E";
      ctx.lineWidth   = 0.65;

      const S       = 58;          // tile size
      const FADE_PX = 380;         // edge band width in px

      for (let row = -1; row < H / S + 2; row++) {
        for (let col = -1; col < W / S + 2; col++) {
          const x = col * S + (row % 2 === 0 ? 0 : S / 2);
          const y = row * S * 0.866;

          // Distance from the nearest viewport edge
          const edgeDist = Math.min(x, W - x, y, H - y);

          // Only render within the edge band
          if (edgeDist > FADE_PX) continue;

          // Alpha: cubic falloff — strong near corners, clean fade inward
          const t     = Math.max(0, 1 - edgeDist / FADE_PX);
          const alpha = t * t * t * 0.28; // max ≈ 28% at the very edge corner

          ctx.globalAlpha = alpha;
          drawStar8(ctx, x, y, S * 0.31, S * 0.13);
        }
      }
      ctx.globalAlpha = 1;
    };

    draw();

    const ro = new ResizeObserver(draw);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position:      "fixed",
        inset:         0,
        pointerEvents: "none",
        zIndex:        0,
      }}
    />
  );
}
