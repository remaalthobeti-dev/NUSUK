"use client";

import { useEffect, useRef, useState } from "react";

const LINE_1 = "خلف كل بطاقة...";
const LINE_2 = "فريق يصنع الفرق";

export function TypewriterTagline({
  charDelay    = 52,
  initialDelay = 900,
  pauseDelay   = 300,
}: {
  charDelay?:    number;
  initialDelay?: number;
  pauseDelay?:   number;
}) {
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [phase, setPhase] = useState<
    "waiting" | "line1" | "pause" | "line2" | "done"
  >("waiting");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    let t: ReturnType<typeof setTimeout>;

    if (phase === "waiting") {
      t = setTimeout(() => setPhase("line1"), initialDelay);
    } else if (phase === "line1") {
      if (line1.length < LINE_1.length) {
        t = setTimeout(() => setLine1(LINE_1.slice(0, line1.length + 1)), charDelay);
      } else {
        t = setTimeout(() => setPhase("pause"), pauseDelay);
      }
    } else if (phase === "pause") {
      setPhase("line2");
    } else if (phase === "line2") {
      if (line2.length < LINE_2.length) {
        t = setTimeout(() => setLine2(LINE_2.slice(0, line2.length + 1)), charDelay);
      } else {
        done.current = true;
        setPhase("done");
      }
    }

    return () => clearTimeout(t);
  }, [phase, line1, line2, charDelay, initialDelay, pauseDelay]);

  const showCursor = phase !== "done";

  return (
    <div
      style={{
        direction:  "rtl",
        textAlign:  "center",
        /* Tight connection — tagline reads as part of the card unit */
        marginTop:  22,
        lineHeight: 1.6,
        opacity:    phase === "waiting" ? 0 : 1,
        transition: "opacity 300ms ease",
      }}
      aria-label={`${LINE_1} ${LINE_2}`}
      aria-live="polite"
    >
      {/* Line 1 — supporting, medium weight, muted green */}
      <p
        style={{
          fontSize:      18,
          fontWeight:    500,
          color:         "#1E3D28",
          letterSpacing: ".1px",
          marginBottom:  8,
          minHeight:     "1.6em",
        }}
      >
        {line1}
        {phase === "line1" && showCursor && (
          <span
            aria-hidden
            style={{
              display:       "inline-block",
              width:         1.5,
              height:        "0.9em",
              background:    "#1E3D28",
              marginRight:   2,
              verticalAlign: "text-bottom",
              opacity:       0.5,
            }}
          />
        )}
      </p>

      {/* Line 2 — headline weight, warm gold */}
      <p
        style={{
          fontSize:      27,
          fontWeight:    700,
          color:         "rgba(178,128,42,.85)",
          letterSpacing: "-.3px",
          minHeight:     "1.6em",
          opacity:
            phase === "waiting" || phase === "line1" || phase === "pause"
              ? 0
              : 1,
          transition: "opacity 200ms ease",
        }}
      >
        {line2}
        {phase === "line2" && showCursor && (
          <span
            aria-hidden
            style={{
              display:       "inline-block",
              width:         1.5,
              height:        "0.85em",
              background:    "rgba(178,128,42,.65)",
              marginRight:   2,
              verticalAlign: "text-bottom",
            }}
          />
        )}
      </p>
    </div>
  );
}
