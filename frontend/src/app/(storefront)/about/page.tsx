"use client";

import React from "react";
import Link from "next/link";
import { useSettings } from "@/context/SettingsContext";

const VALUES = [
  {
    icon: "✦",
    title: "Made with Barakah",
    text: "Every gift is assembled by hand with care, prayer and intention.",
  },
  {
    icon: "❖",
    title: "Premium Craft",
    text: "We source fine velvets, woods and metals for lasting keepsakes.",
  },
  {
    icon: "✧",
    title: "Delivered with Love",
    text: "Gift-wrapped and shipped to doorsteps across the world.",
  },
];

export default function AboutPage() {
  const settings = useSettings();

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="bg-emerald text-cream">
        <div className="mx-auto max-w-3xl px-4 md:px-7 py-16 md:py-24 text-center">
          <p className="font-sans text-[11px] tracking-[0.28em] uppercase text-gold">
            Our Story
          </p>
          <h1 className="font-display font-medium text-4xl md:text-[52px] leading-tight mt-4">
            Gifts that carry blessings
          </h1>
          <p className="font-display italic text-lg md:text-[22px] leading-relaxed text-[#d7cfbb] mt-5">
            Every hamper we make is a small act of love — meant to be felt,
            remembered and cherished.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-5xl px-4 md:px-7 py-14 md:py-[70px] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-11 items-center">
        <div className="h-64 md:h-[380px] border border-line rounded bg-[repeating-linear-gradient(135deg,#efe7d4_0_16px,#f5eede_16px_32px)] flex items-center justify-center">
          <span className="font-mono text-xs tracking-[0.2em] text-gold-muted">
            ATELIER PHOTO
          </span>
        </div>
        <div>
          <h2 className="font-display font-medium text-3xl md:text-[34px] text-ink mb-4">
            Handcrafted with intention
          </h2>
          <p className="font-sans font-light text-[15px] leading-[1.8] text-ink-body">
            {settings.storeName} began with a simple belief — that a gift should feel
            personal, meaningful and beautiful. From our atelier, our artisans
            hand-assemble each Quran set, prayer rug and hamper, choosing every detail to
            make someone feel seen, valued and celebrated.
          </p>
          <p className="font-sans font-light text-[15px] leading-[1.8] text-ink-body mt-3.5">
            Today we ship blessings to families across India and around the world — but the
            care behind every box has never changed.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-paper border-y border-line">
        <div className="mx-auto max-w-5xl px-4 md:px-7 py-12 md:py-[60px] grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 text-center">
          {VALUES.map((v) => (
            <div key={v.title}>
              <div className="font-display text-[40px] leading-none text-gold">{v.icon}</div>
              <h3 className="font-display font-medium text-2xl text-ink mt-3.5 mb-2">
                {v.title}
              </h3>
              <p className="font-sans font-light text-sm leading-[1.7] text-muted">
                {v.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-4 md:px-7 py-14 md:py-[70px] text-center">
        <h2 className="font-display font-medium text-3xl md:text-[34px] text-ink mb-5">
          Ready to share the barakah?
        </h2>
        <Link
          href="/category/all"
          className="inline-block bg-emerald text-cream font-sans text-[13px] tracking-[0.1em] uppercase px-9 py-4 rounded-sm hover:bg-emerald-light transition"
        >
          Explore the Collection
        </Link>
      </section>
    </div>
  );
}
