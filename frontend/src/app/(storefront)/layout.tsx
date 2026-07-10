"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Droplet, ShoppingBag, User, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";

function useNavCategories() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("/category")
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error("Failed to load nav categories", err));
  }, []);

  return categories;
}

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
  const { user } = useAuth();
  const pathname = usePathname();
  const categories = useNavCategories();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="hidden md:block sticky top-0 z-50 border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        {/* Nav */}
        <nav className="hidden items-center gap-7 text-sm font-semibold text-gray-600 md:flex">
          <Link href="/" className="transition hover:text-amber-700">Home</Link>
          {categories.slice(0, 4).map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`} className="transition hover:text-amber-700">
              {cat.name}
            </Link>
          ))}
          <Link href="/category/all" className="transition hover:text-amber-700">All Products</Link>
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
            href={user ? "/profile" : `/login/customer?redirect=${encodeURIComponent(pathname)}`}
            className="hidden items-center gap-1.5 text-sm font-bold text-gray-600 transition hover:text-amber-700 sm:flex"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={2.25} />
            {user ? "My Profile" : "Sign In"}
          </Link>
        </div>
      </div>
    </header>
  );
}

function MobileTopAppBar() {
  return (
    <header className="md:hidden fixed top-0 left-0 w-full z-50 flex items-center justify-between px-container-margin py-sm bg-surface border-b border-outline-variant">
      <div className="flex items-center gap-xs">
        <span className="material-symbols-outlined filled text-primary">location_on</span>
        <div className="flex flex-col">
          <span className="text-badge-micro text-outline font-label-bold uppercase tracking-wider">Deliver to Home</span>
          <span className="text-title-md font-extrabold text-on-surface leading-tight">Arvion</span>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant">
        <span className="material-symbols-outlined text-on-secondary-container">person</span>
      </div>
    </header>
  );
}

function MobileBottomNavBar() {
  const { items } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface border-t border-outline-variant px-sm py-xs pb-safe pb-4">
      <div className="flex justify-around items-center">
        <Link href="/" className="flex flex-col items-center p-xs text-primary group">
          <span className="material-symbols-outlined filled text-2xl group-hover:scale-110 transition-transform">home</span>
          <span className="text-badge-micro font-label-bold mt-1">Home</span>
        </Link>
        <Link href="/category/all" className="flex flex-col items-center p-xs text-outline group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">grid_view</span>
          <span className="text-badge-micro font-label-bold mt-1">Categories</span>
        </Link>
        <Link href="/cart" className="flex flex-col items-center p-xs text-outline relative group">
          <div className="relative">
            <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">shopping_cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-on-error text-badge-micro font-label-bold w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>
            )}
          </div>
          <span className="text-badge-micro font-label-bold mt-1">Cart</span>
        </Link>
        <Link href={user ? "/profile" : `/login/customer?redirect=${encodeURIComponent(pathname)}`} className="flex flex-col items-center p-xs text-outline group">
          <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">person</span>
          <span className="text-badge-micro font-label-bold mt-1">Profile</span>
        </Link>
      </div>
    </nav>
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
  const categories = useNavCategories();

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <MobileTopAppBar />
      <main className="flex flex-1 flex-col md:pt-0 pt-16 pb-20 md:pb-0">{children}</main>
      <MobileBottomNavBar />
      <footer className="hidden md:block border-t bg-gray-900 px-6 py-12 text-gray-400">
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
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`} className="transition hover:text-amber-400">{cat.name}</Link>
                </li>
              ))}
              <li><Link href="/category/all" className="transition hover:text-amber-400">All Products</Link></li>
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
