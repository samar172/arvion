"use client";

import React from "react";
import { Truck } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { inr } from "@/lib/format";

export function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const settings = useSettings();
  const threshold = Number(settings.freeShippingThreshold) || 0;
  if (threshold <= 0) return null;
  const left = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, (subtotal / threshold) * 100);
  return (
    <div className="rounded-md border border-line bg-card px-4 py-3.5">
      <p className="flex items-center gap-2 font-sans text-[13px] text-ink-body">
        <Truck className="h-4 w-4 text-gold-dark shrink-0" strokeWidth={1.75} />
        {left > 0 ? (
          <span>
            Add <span className="font-medium text-emerald">{inr(left)}</span> more for free shipping
          </span>
        ) : (
          <span className="text-emerald font-medium">You&apos;ve unlocked free shipping</span>
        )}
      </p>
      <div className="mt-2.5 h-1.5 rounded-full bg-line-soft overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-emerald transition-[width] duration-700 ease-out-expo"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
