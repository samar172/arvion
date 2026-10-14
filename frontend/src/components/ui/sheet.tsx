"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Modal panel that slides in from the left (drawer) or bottom (sheet).
 * Locks page scroll, closes on Escape / backdrop tap, and returns focus on close.
 */
export function Sheet({
  open,
  onClose,
  side = "bottom",
  title,
  children,
  footer,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  side?: "bottom" | "left" | "right";
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const position =
    side === "bottom"
      ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl animate-sheetUp"
      : side === "left"
      ? "inset-y-0 left-0 w-[86vw] max-w-sm animate-drawerIn"
      : "inset-y-0 right-0 w-[86vw] max-w-sm animate-fadeIn";

  return (
    <div className="fixed inset-0 z-overlay" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-emerald-deep/50 animate-fadeIn cursor-default"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`absolute flex flex-col bg-paper shadow-[0_-12px_40px_-12px_rgba(10,46,34,0.35)] outline-none ${position} ${className}`}
      >
        {side === "bottom" && (
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line" aria-hidden />
        )}
        {title !== undefined && (
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-line">
            <div className="font-display text-2xl text-ink">{title}</div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 p-2 rounded-full text-ink-soft hover:bg-line-soft transition"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4 pb-safe">{footer}</div>}
      </div>
    </div>
  );
}
