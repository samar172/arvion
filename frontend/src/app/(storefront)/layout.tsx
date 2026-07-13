"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useNavCategories } from "@/hooks/use-nav-categories";
import { useStandalone } from "@/hooks/use-standalone";
import { AddedToBagBar } from "@/components/cart/added-to-bag-bar";
import {
  ShoppingBag,
  User,
  Home,
  LayoutGrid,
  PackageSearch,
} from "lucide-react";

function AnnouncementBar() {
  const settings = useSettings();
  if (settings.announcementOn !== "true" || !settings.announcementText) return null;

  const items = [
    settings.announcementText,
    "Handcrafted with love",
    "Worldwide delivery",
  ];

  return (
    <div className="bg-emerald text-sand overflow-hidden whitespace-nowrap font-sans text-[11px] md:text-xs tracking-[0.12em] uppercase">
      <div className="inline-flex gap-14 py-2.5 px-7 animate-marquee">
        {[...items, ...items].map((text, i) => (
          <span key={i}>✦&nbsp;&nbsp;{text}</span>
        ))}
      </div>
    </div>
  );
}

function Brand({ dark = false }: { dark?: boolean }) {
  const settings = useSettings();
  return (
    <Link href="/" className="flex items-center gap-2.5 md:gap-3 leading-none">
      <Image
        src="/logo.png"
        alt={settings.storeName}
        width={942}
        height={957}
        priority
        className="h-11 w-auto md:h-12 shrink-0"
      />
      <span className="flex flex-col">
        <span
          className={`font-brand text-xl md:text-2xl tracking-[0.22em] ${
            dark ? "text-cream" : "text-emerald"
          }`}
        >
          {settings.storeName}
        </span>
        <span className="font-sans text-[8px] md:text-[9px] tracking-[0.42em] uppercase text-gold-muted mt-1 pl-0.5">
          {settings.storeTagline}
        </span>
      </span>
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
    <header className="sticky top-0 z-50 bg-paper border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 md:px-7 py-3.5 md:py-4">
        <Brand />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7">
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="font-sans text-[13px] tracking-[0.06em] text-ink-soft hover:text-gold-muted transition"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/category/all"
            className="font-sans text-[13px] tracking-[0.06em] text-ink-soft hover:text-gold-muted transition"
          >
            Shop All
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4 md:gap-5">
          <Link
            href="/track"
            className="hidden sm:block font-sans text-xs tracking-[0.06em] text-ink-soft hover:text-gold-muted transition"
          >
            Track
          </Link>
          <Link
            href={
              user
                ? "/profile"
                : `/login/customer?redirect=${encodeURIComponent(pathname)}`
            }
            className="hidden sm:flex items-center gap-1.5 font-sans text-[13px] tracking-[0.06em] text-ink-soft hover:text-gold-muted transition"
          >
            <User className="h-4 w-4" strokeWidth={2} />
            {user ? "Account" : "Sign In"}
          </Link>
          <Link
            href="/cart"
            aria-label="Bag"
            className="relative flex items-center gap-2 font-sans text-[13px] tracking-[0.06em] text-emerald"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="hidden sm:inline">Bag</span>
            {totalItems > 0 && (
              <span className="absolute -right-2.5 -top-2 sm:static sm:ml-0 bg-emerald text-sand text-[11px] min-w-[19px] h-[19px] rounded-full inline-flex items-center justify-center px-1.5">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const { items } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const linkClass = (active: boolean) =>
    `flex flex-col items-center gap-1 p-1 ${
      active ? "text-gold" : "text-sand-dim"
    }`;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-emerald border-t border-emerald-light px-2 pt-2 pb-safe pb-4">
      <div className="flex justify-around items-center">
        <Link href="/" className={linkClass(pathname === "/")}>
          <Home className="h-[22px] w-[22px]" strokeWidth={2} />
          <span className="font-sans text-[10px] tracking-wide">Home</span>
        </Link>
        <Link
          href="/category/all"
          className={linkClass(pathname.startsWith("/category"))}
        >
          <LayoutGrid className="h-[22px] w-[22px]" strokeWidth={2} />
          <span className="font-sans text-[10px] tracking-wide">Shop</span>
        </Link>
        <Link href="/cart" className={linkClass(pathname === "/cart")}>
          <div className="relative">
            <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={2} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-gold text-emerald text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span className="font-sans text-[10px] tracking-wide">Bag</span>
        </Link>
        <Link href="/track" className={linkClass(pathname === "/track")}>
          <PackageSearch className="h-[22px] w-[22px]" strokeWidth={2} />
          <span className="font-sans text-[10px] tracking-wide">Track</span>
        </Link>
        <Link
          href={
            user
              ? "/profile"
              : `/login/customer?redirect=${encodeURIComponent(pathname)}`
          }
          className={linkClass(
            pathname.startsWith("/profile") || pathname.startsWith("/login")
          )}
        >
          <User className="h-[22px] w-[22px]" strokeWidth={2} />
          <span className="font-sans text-[10px] tracking-wide">Account</span>
        </Link>
      </div>
    </nav>
  );
}

function Footer() {
  const settings = useSettings();
  const categories = useNavCategories();

  const socials = [
    { label: "Instagram", href: settings.instagram },
    { label: "Facebook", href: settings.facebook },
    { label: "YouTube", href: settings.youtube },
  ].filter((s) => s.href);

  return (
    <footer className="bg-emerald-deep text-[#cdd8cf] pb-16 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 md:px-7 pt-14 pb-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10">
        <div>
          <Brand dark />
          <p className="font-display italic text-lg leading-relaxed text-[#9fb2a4] mt-5 max-w-[280px]">
            Share the barakah — thoughtful Islamic gifts, handcrafted with love
            and delivered worldwide.
          </p>
          {socials.length > 0 && (
            <div className="flex gap-4 mt-5 font-sans text-xs tracking-[0.08em] uppercase">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:text-gold-light transition"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="font-sans text-xs tracking-[0.16em] uppercase text-cream mb-4">
            Shop
          </p>
          <div className="flex flex-col gap-2.5 font-sans text-sm">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="text-[#cdd8cf] hover:text-gold transition"
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/category/all" className="text-[#cdd8cf] hover:text-gold transition">
              All Gifts
            </Link>
          </div>
        </div>
        <div>
          <p className="font-sans text-xs tracking-[0.16em] uppercase text-cream mb-4">
            Help
          </p>
          <div className="flex flex-col gap-2.5 font-sans text-sm">
            <Link href="/faq" className="text-[#cdd8cf] hover:text-gold transition">FAQs</Link>
            <Link href="/track" className="text-[#cdd8cf] hover:text-gold transition">Track Order</Link>
            <Link href="/contact" className="text-[#cdd8cf] hover:text-gold transition">Contact Us</Link>
            <Link href="/faq" className="text-[#cdd8cf] hover:text-gold transition">Shipping &amp; Returns</Link>
          </div>
        </div>
        <div>
          <p className="font-sans text-xs tracking-[0.16em] uppercase text-cream mb-4">
            Company
          </p>
          <div className="flex flex-col gap-2.5 font-sans text-sm">
            <Link href="/about" className="text-[#cdd8cf] hover:text-gold transition">About Us</Link>
            <Link href="/contact" className="text-[#cdd8cf] hover:text-gold transition">Bulk &amp; Corporate</Link>
            <Link href="/faq" className="text-[#cdd8cf] hover:text-gold transition">Privacy Policy</Link>
            <Link href="/faq" className="text-[#cdd8cf] hover:text-gold transition">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[#12402f]">
        <div className="mx-auto max-w-7xl px-4 md:px-7 py-5 flex flex-wrap justify-between gap-2.5 font-sans text-xs text-[#7f9488]">
          <span>
            © {new Date().getFullYear()} {settings.storeName} Gifting. All rights reserved.
          </span>
          <span>
            {[settings.address, settings.supportEmail].filter(Boolean).join(" · ")}
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Installed PWA gets an app-like chrome: bottom nav only, no marketing footer.
  const standalone = useStandalone();

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <AnnouncementBar />
      <Header />
      <main className="flex flex-1 flex-col pb-20 lg:pb-0">{children}</main>
      {!standalone && <Footer />}
      <MobileBottomNav />
      <AddedToBagBar />
    </div>
  );
}
