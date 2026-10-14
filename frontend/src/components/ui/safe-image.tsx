"use client";

import React, { useState } from "react";

/**
 * <img> that swaps to the brand pattern when the URL fails to load,
 * instead of showing the browser's broken-image icon and alt text.
 */
export function SafeImage({
  src,
  alt,
  className = "",
  fallbackLabel,
  ...rest
}: React.ImgHTMLAttributes<HTMLImageElement> & { fallbackLabel?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={`${className} pattern-paper flex items-center justify-center font-sans text-[10px] tracking-[0.2em] uppercase text-gold-muted`}
      >
        {fallbackLabel}
      </span>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} {...rest} />;
}
