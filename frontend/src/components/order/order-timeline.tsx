"use client";

import React from "react";

export const STATUS_STEPS = [
  { id: "PENDING", label: "Placed", hint: "We received your order" },
  { id: "CONFIRMED", label: "Confirmed", hint: "Payment received" },
  { id: "PROCESSING", label: "Packing", hint: "Wrapped with care" },
  { id: "SHIPPED", label: "Shipped", hint: "On its way to you" },
  { id: "DELIVERED", label: "Delivered", hint: "Enjoy your gift" },
];

export function OrderTimeline({ status }: { status: string }) {
  const failed = status === "FAILED" || status === "CANCELLED";

  if (failed) {
    return (
      <div className="border border-danger/40 bg-danger/5 rounded-sm px-4 py-3.5 font-sans text-sm text-danger">
        This order was {status === "FAILED" ? "not completed" : "cancelled"}. If money was
        deducted it will be refunded within 5–7 business days.
      </div>
    );
  }

  const currentIndex = Math.max(
    0,
    STATUS_STEPS.findIndex((s) => s.id === status)
  );

  return (
    <ol className="flex flex-col gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === STATUS_STEPS.length - 1;
        return (
          <li key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`w-3.5 h-3.5 rounded-full border-2 flex-none mt-1.5 ${
                  done ? "bg-emerald border-emerald" : "bg-card border-line"
                }`}
              />
              {!isLast && (
                <span
                  className={`w-px flex-1 min-h-[38px] ${
                    i < currentIndex ? "bg-emerald" : "bg-line"
                  }`}
                />
              )}
            </div>
            <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`font-sans text-sm ${
                  done ? "text-emerald font-medium" : "text-muted-2"
                }`}
              >
                {step.label}
              </p>
              <p className="font-sans text-xs text-muted mt-0.5">{step.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "DELIVERED"
      ? "bg-emerald text-cream border-emerald"
      : status === "FAILED" || status === "CANCELLED"
      ? "border-danger text-danger bg-danger/5"
      : "border-gold text-gold-dark bg-[#f8f2e2]";
  return (
    <span
      className={`inline-block border rounded-full px-3 py-1 font-sans text-[11px] tracking-[0.1em] uppercase ${tone}`}
    >
      {status.toLowerCase()}
    </span>
  );
}
