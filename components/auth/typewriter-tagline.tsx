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
    /*
      Sits directly below the card with modest breathing room.
      Text is intentionally subordinate — the card is the hero.
    */
    <div
      style={{
        direction:  "rtl",
        textAlign:  "center",
        marginTop:  24,
        lineHeight: 1.55,
        opacity:    phase === "waiting" ? 0 : 1,
        transition: "opacity 300ms ease",
      }}
      aria-label={`${LINE_1} ${LINE_2}`}
      aria-live="polite"
    >
      {/* Line 1 — smaller, lighter, dark green */}
      <p
        style={{
          fontSize:      13,
          fontWeight:    400,
          color:         "#1E3D28",      /* muted dark green, not full-brand */
          letterSpacing: ".05px",
          marginBottom:  3,
          minHeight:     "1.55em",
        }}
      >
        {line1}
        {phase === "line1" && showCursor && (
          <span
            aria-hidden
            style={{
              display:        "inline-block",
              width:          1.5,
              height:         "0.9em",
              background:     "#1E3D28",
              marginRight:    2,
              verticalAlign:  "text-bottom",
              opacity:        0.55,
            }}
          />
        )}
      </p>

      {/* Line 2 — slightly larger, quieter gold */}
      <p
        style={{
          fontSize:      17,
          fontWeight:    600,
          /* Muted warm gold — present but not shouting */
          color:         "rgba(180,130,45,.78)",
          letterSpacing: "-.15px",
          minHeight:     "1.55em",
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
              background:    "rgba(180,130,45,.65)",
              marginRight:   2,
              verticalAlign: "text-bottom",
            }}
          />
        )}
      </p>
    </div>
  );
}
