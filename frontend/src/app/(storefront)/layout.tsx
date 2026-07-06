"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Droplet, ShoppingBag, User, CheckCircle2 } from "lucide-react";

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm ring-1 ring-amber-500/20 transition-transform duration-200 group-hover:scale-105">
        <Droplet className="h-5 w-5" strokeWidth={2.25} fill="currentColor" fillOpacity={0.15} />
      </span>
      <div className="leading-tight">
        <p className={`font-display text-lg font-extrabold ${dark ? "text-white" : "text-gray-900"}`}>Arvion</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">Pure Attar &amp; Ittar</p>
      </div>
    </Link>
  );
}

function Header() {
  const { items } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        {/* Nav */}
        <nav className="hidden items-center gap-7 text-sm font-semibold text-gray-600 md:flex">
          <Link href="/" className="transition hover:text-amber-700">Home</Link>
          <Link href="/category/rose-floral" className="transition hover:text-amber-700">Collections</Link>
          <Link href="/category/gift-collections" className="transition hover:text-amber-700">Gift Sets</Link>
          <Link href="/category/exotic-rare" className="transition hover:text-amber-700">Rare Attars</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-100 sm:px-4"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2.25} />
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-white shadow">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            href="/login"
            className="hidden items-center gap-1.5 text-sm font-bold text-gray-600 transition hover:text-amber-700 sm:flex"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={2.25} />
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}

const WHY_ATTAR = [
  "100% Natural & Alcohol-Free",
  "Halal Certified",
  "No Synthetic Chemicals",
  "Long-lasting (8–14 hrs)",
  "Eco-Friendly Production",
];

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t bg-gray-900 px-6 py-12 text-gray-400">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="mb-3">
              <Logo dark />
            </div>
            <p className="text-sm leading-relaxed">
              Traditional, alcohol-free attar oils distilled using centuries-old methods from the finest botanicals.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Collections</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/rose-floral" className="transition hover:text-amber-400">Rose &amp; Floral</Link></li>
              <li><Link href="/category/oud-woody" className="transition hover:text-amber-400">Oud &amp; Woody</Link></li>
              <li><Link href="/category/musk-amber" className="transition hover:text-amber-400">Musk &amp; Amber</Link></li>
              <li><Link href="/category/exotic-rare" className="transition hover:text-amber-400">Exotic &amp; Rare</Link></li>
              <li><Link href="/category/gift-collections" className="transition hover:text-amber-400">Gift Collections</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">Why Attar?</p>
            <ul className="space-y-2 text-sm">
              {WHY_ATTAR.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={2.25} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-gray-800 pt-6 text-center text-xs">
          © {new Date().getFullYear()} Arvion — Pure Attar &amp; Ittar. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
