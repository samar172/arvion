"use client";

import { useEffect, useState } from "react";

/**
 * True when the app is running as an installed PWA rather than a browser tab.
 * Covers Android/desktop (display-mode: standalone) and iOS Safari
 * (navigator.standalone, which never reports the media query).
 *
 * Always false on the server and on first client render so SSR markup matches;
 * it flips after mount.
 */
export function useStandalone() {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const iosStandalone = () =>
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    const sync = () => setStandalone(mq.matches || iosStandalone());
    sync();

    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return standalone;
}
