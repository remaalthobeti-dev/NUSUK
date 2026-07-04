"use client";

import { useEffect, useRef, useState } from "react";

const LINE_1 = "خلف كل بطاقة...";
const LINE_2 = "فريق يصنع الفرق";

/*
  Two-line typewriter:
    1. Wait initialDelay, then type line 1 character by character.
    2. Pause pauseDelay ms.
    3. Type line 2.
    4. Done — cursor disappears.
  Runs once per mount (i.e. once per page load).
*/
export function TypewriterTagline({
  charDelay    = 55,   // ms between characters
  initialDelay = 900,  // ms before starting
  pauseDelay   = 320,  // ms between lines
}: {
  charDelay?:    number;
  initialDelay?: number;
  pauseDelay?:   number;
}) {
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [phase, setPhase]  = useState<"waiting" | "line1" | "pause" | "line2" | "done">("waiting");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;

    let timer: ReturnType<typeof setTimeout>;

    if (phase === "waiting") {
      timer = setTimeout(() => setPhase("line1"), initialDelay);

    } else if (phase === "line1") {
      if (line1.length < LINE_1.length) {
        timer = setTimeout(
          () => setLine1(LINE_1.slice(0, line1.length + 1)),
          charDelay
        );
      } else {
        timer = setTimeout(() => setPhase("pause"), pauseDelay);
      }

    } else if (phase === "pause") {
      setPhase("line2");

    } else if (phase === "line2") {
      if (line2.length < LINE_2.length) {
        timer = setTimeout(
          () => setLine2(LINE_2.slice(0, line2.length + 1)),
          charDelay
        );
      } else {
        done.current = true;
        setPhase("done");
      }
    }

    return () => clearTimeout(timer);
  }, [phase, line1, line2, charDelay, initialDelay, pauseDelay]);

  const showCursor = phase !== "done";

  return (
    <div
      className="relative z-10 text-center"
      style={{ marginTop: 52, direction: "rtl" }}
      aria-label={`${LINE_1} ${LINE_2}`}
      aria-live="polite"
    >
      {/* Line 1 — dark green */}
      <p
        className="text-balance"
        style={{
          fontSize: 17,
          fontWeight: 500,
          color: "#143825",
          letterSpacing: "-.1px",
          lineHeight: 1.6,
          minHeight: "1.6em",
          opacity: phase === "waiting" ? 0 : 1,
          transition: "opacity 200ms ease",
        }}
      >
        {line1}
        {phase === "line1" && showCursor && (
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 2,
              height: "1em",
              background: "#143825",
              marginRight: 2,
              verticalAlign: "text-bottom",
              opacity: 0.7,
              animation: "none",
            }}
          />
        )}
      </p>

      {/* Line 2 — gold calligraphic */}
      <p
        className="text-balance"
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: "#C9963E",
          letterSpacing: "-.4px",
          lineHeight: 1.25,
          minHeight: "1.25em",
          marginTop: 4,
          opacity: phase === "waiting" || phase === "line1" || phase === "pause" ? 0 : 1,
          transition: "opacity 200ms ease",
        }}
      >
        {line2}
        {phase === "line2" && showCursor && (
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 2,
              height: "0.85em",
              background: "#C9963E",
              marginRight: 2,
              verticalAlign: "text-bottom",
              opacity: 0.8,
            }}
          />
        )}
      </p>

      {/* Decorative gold ornament */}
      {phase === "done" && (
        <div
          className="mx-auto mt-4"
          style={{
            opacity: 0,
            animation: "n-fade 0.6s 0.2s ease forwards",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 2 l2.35 6.8 7.15-.05-5.8 4.2 2.2 6.85L14 15.6l-5.9 4.2 2.2-6.85-5.8-4.2 7.15.05z"
              fill="rgba(201,150,62,.55)"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
