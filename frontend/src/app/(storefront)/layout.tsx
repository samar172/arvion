"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

function Header() {
  const { items } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🏺</span>
          <div>
            <p className="font-display font-extrabold text-gray-900 text-lg leading-tight">Arvion</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-tight">Pure Attar & Ittar</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-bold text-gray-600">
          <Link href="/" className="hover:text-amber-700 transition">Home</Link>
          <Link href="/category/rose-floral" className="hover:text-amber-700 transition">Collections</Link>
          <Link href="/category/gift-collections" className="hover:text-amber-700 transition">Gift Sets</Link>
          <Link href="/category/exotic-rare" className="hover:text-amber-700 transition">Rare Attars</Link>
        </nav>

        {/* Cart */}
        <div className="flex items-center space-x-3">
          <Link
            href="/cart"
            className="relative flex items-center space-x-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-sm px-4 py-2 rounded-xl transition"
          >
            <span className="text-base">🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            href="/login"
            className="text-sm font-bold text-gray-600 hover:text-amber-700 transition hidden sm:block"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="border-t bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-2xl">🏺</span>
              <div>
                <p className="font-display font-extrabold text-white text-lg leading-tight">Arvion</p>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Pure Attar & Ittar</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed">
              Traditional, alcohol-free attar oils distilled using centuries-old methods from the finest botanicals.
            </p>
          </div>
          <div>
            <p className="font-bold text-white mb-3 uppercase text-xs tracking-widest">Collections</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/rose-floral" className="hover:text-amber-400 transition">Rose & Floral</Link></li>
              <li><Link href="/category/oud-woody" className="hover:text-amber-400 transition">Oud & Woody</Link></li>
              <li><Link href="/category/musk-amber" className="hover:text-amber-400 transition">Musk & Amber</Link></li>
              <li><Link href="/category/exotic-rare" className="hover:text-amber-400 transition">Exotic & Rare</Link></li>
              <li><Link href="/category/gift-collections" className="hover:text-amber-400 transition">Gift Collections</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-white mb-3 uppercase text-xs tracking-widest">Why Attar?</p>
            <ul className="space-y-2 text-sm">
              <li>✅ 100% Natural & Alcohol-Free</li>
              <li>✅ Halal Certified</li>
              <li>✅ No Synthetic Chemicals</li>
              <li>✅ Long-lasting (8–14 hrs)</li>
              <li>✅ Eco-Friendly Production</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center text-xs">
          © {new Date().getFullYear()} Arvion — Pure Attar & Ittar. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
