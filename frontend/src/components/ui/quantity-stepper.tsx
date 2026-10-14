"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number | null;
  size?: "sm" | "md";
}) {
  const atMax = max != null && value >= max;
  const box = size === "sm" ? "w-9 h-9" : "w-11 h-12";
  return (
    <div className="inline-flex items-center border border-line bg-card rounded-sm">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`${box} flex items-center justify-center text-emerald hover:bg-line-soft transition disabled:opacity-30 disabled:hover:bg-transparent`}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <span
        className="font-sans text-sm min-w-[28px] text-center text-ink tabular"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        aria-label="Increase quantity"
        title={atMax ? `Only ${max} available` : undefined}
        className={`${box} flex items-center justify-center text-emerald hover:bg-line-soft transition disabled:opacity-30 disabled:hover:bg-transparent`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
