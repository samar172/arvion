"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");

  useEffect(() => {
    // Only show once per browser session
    if (sessionStorage.getItem("splash_shown")) {
      setPhase("done");
      return;
    }
    sessionStorage.setItem("splash_shown", "1");

    // fade-in → hold → fade-out → unmount
    const toHold = setTimeout(() => setPhase("hold"), 600);
    const toOut  = setTimeout(() => setPhase("out"),  2000);
    const toDone = setTimeout(() => setPhase("done"), 2800);

    return () => {
      clearTimeout(toHold);
      clearTimeout(toOut);
      clearTimeout(toDone);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#f5efe6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.7s ease",
        opacity: phase === "out" ? 0 : 1,
      }}
    >
      <div
        style={{
          transition: "opacity 0.5s ease, transform 0.5s ease",
          opacity: phase === "in" ? 0 : 1,
          transform: phase === "in" ? "scale(0.92)" : "scale(1)",
          textAlign: "center",
        }}
      >
        <img
          src="/logo.jpeg"
          alt="Arvion Solutions"
          style={{
            width: "min(320px, 72vw)",
            height: "auto",
            borderRadius: "16px",
          }}
        />
      </div>
    </div>
  );
}
