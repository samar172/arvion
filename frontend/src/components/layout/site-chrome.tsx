"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Heart,
  Home,
  LayoutGrid,
  Mail,
  Menu,
  PackageSearch,
  Phone,
  Search,
  ShoppingBag,
  User,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useWishlist } from "@/context/WishlistContext";
import { useNavCategories } from "@/hooks/use-nav-categories";
import { Sheet } from "@/components/ui/sheet";
import { SearchOverlay } from "./search-overlay";

/** Routes that render their own sticky action bar on mobile instead of the tab bar. */
export function hasOwnMobileBar(pathname: string) {
  return (
    pathname.startsWith("/products/") || pathname === "/cart" || pathname === "/checkout"
  );
}

function accountHref(loggedIn: boolean, pathname: string) {
  return loggedIn ? "/profile" : `/login/customer?redirect=${encodeURIComponent(pathname)}`;
}

function CountBadge({ count, tone = "emerald" }: { count: number; tone?: "emerald" | "gold" }) {
  if (count <= 0) return null;
  return (
    <span
      key={count}
      className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full inline-flex items-center justify-center font-sans text-[10px] font-semibold tabular animate-pop ${
        tone === "gold" ? "bg-gold text-emerald" : "bg-emerald text-sand"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AnnouncementBar() {
  const settings = useSettings();
  if (settings.announcementOn !== "true" || !settings.announcementText) return null;

  const items = [settings.announcementText, "Handcrafted with love", "Worldwide delivery"];

  return (
    <div className="bg-emerald text-sand overflow-hidden whitespace-nowrap font-sans text-[11px] md:text-xs tracking-[0.12em] uppercase">
      <div className="inline-flex gap-14 py-2 md:py-2.5 px-7 animate-marquee hover:[animation-play-state:paused]">
        {[...items, ...items].map((text, i) => (
          <span key={i} aria-hidden={i >= items.length}>
            ✦&nbsp;&nbsp;{text}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Brand({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const settings = useSettings();
  return (
    <Link href="/" className="flex items-center gap-2 md:gap-3 leading-none" aria-label={`${settings.storeName} home`}>
      <Image
        src="/logo.png"
        alt=""
        width={942}
        height={957}
        priority
        className={`w-auto shrink-0 transition-[height] duration-300 ${
          compact ? "h-9 md:h-10" : "h-10 md:h-12"
        }`}
      />
      <span className="flex flex-col">
        <span
          className={`font-brand text-lg sm:text-xl md:text-2xl tracking-[0.2em] ${
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

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = useNavCategories();
  const { user } = useAuth();
  const settings = useSettings();
  const pathname = usePathname();
  const whatsapp = settings.whatsapp?.replace(/\D/g, "");

  const row =
    "flex items-center justify-between px-5 py-3.5 border-b border-line-soft font-sans text-[15px] text-ink-soft hover:bg-card transition";

  return (
    <Sheet open={open} onClose={onClose} side="left" title="Menu">
      <nav aria-label="Mobile">
        <p className="eyebrow px-5 pt-5 pb-2">Shop</p>
        <Link href="/category/all" onClick={onClose} className={row}>
          All gifts <ChevronRight className="h-4 w-4 text-gold" />
        </Link>
        {categories.map((cat) => (
          <Link key={cat.id} href={`/category/${cat.slug}`} onClick={onClose} className={row}>
            {cat.name} <ChevronRight className="h-4 w-4 text-gold" />
          </Link>
        ))}

        <p className="eyebrow px-5 pt-6 pb-2">Your account</p>
        <Link href={accountHref(!!user, pathname)} onClick={onClose} className={row}>
          <span className="flex items-center gap-3">
            <User className="h-4 w-4 text-emerald" strokeWidth={1.75} />
            {user ? "My account" : "Sign in"}
          </span>
        </Link>
        <Link href="/wishlist" onClick={onClose} className={row}>
          <span className="flex items-center gap-3">
            <Heart className="h-4 w-4 text-emerald" strokeWidth={1.75} /> Wishlist
          </span>
        </Link>
        <Link href="/track" onClick={onClose} className={row}>
          <span className="flex items-center gap-3">
            <PackageSearch className="h-4 w-4 text-emerald" strokeWidth={1.75} /> Track order
          </span>
        </Link>

        <p className="eyebrow px-5 pt-6 pb-2">Help</p>
        {[
          ["About us", "/about"],
          ["FAQs & policies", "/faq"],
          ["Contact us", "/contact"],
        ].map(([label, href]) => (
          <Link key={href} href={href} onClick={onClose} className={row}>
            {label}
          </Link>
        ))}

        <div className="px-5 py-6 flex flex-col gap-2.5 font-sans text-sm text-ink-body">
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-emerald">
              <Phone className="h-4 w-4 text-gold-dark" strokeWidth={1.75} /> WhatsApp {settings.whatsapp}
            </a>
          )}
          {settings.supportEmail && (
            <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2.5 hover:text-emerald">
              <Mail className="h-4 w-4 text-gold-dark" strokeWidth={1.75} /> {settings.supportEmail}
            </a>
          )}
        </div>
      </nav>
    </Sheet>
  );
}

export function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const pathname = usePathname();
  const categories = useNavCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" opens search from anywhere, like most storefronts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(target.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const navLink = (href: string, active: boolean) =>
    `relative font-sans text-[13px] tracking-[0.06em] py-2 transition-colors after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:bg-gold after:origin-left after:transition-transform after:duration-300 ${
      active
        ? "text-emerald after:scale-x-100"
        : "text-ink-soft hover:text-emerald after:scale-x-0 hover:after:scale-x-100"
    }`;

  const iconBtn =
    "relative flex h-10 w-10 items-center justify-center rounded-full text-emerald hover:bg-line-soft transition";

  return (
    <>
      <header
        className={`sticky top-0 z-header bg-paper/95 backdrop-blur-md border-b transition-[box-shadow,border-color] duration-300 ${
          scrolled
            ? "border-line shadow-[0_10px_30px_-20px_rgba(13,59,44,0.45)]"
            : "border-line/70"
        }`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-center justify-between gap-3 md:gap-6 px-3 sm:px-4 md:px-7 transition-[padding] duration-300 ${
            scrolled ? "py-2 md:py-2.5" : "py-2.5 md:py-3.5"
          }`}
        >
          <div className="flex items-center gap-1 lg:gap-0 min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className={`${iconBtn} lg:hidden -ml-1`}
            >
              <Menu className="h-[22px] w-[22px]" strokeWidth={1.75} />
            </button>
            <Brand compact={scrolled} />
          </div>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="Main">
            {categories.slice(0, 5).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={navLink(`/category/${cat.slug}`, pathname === `/category/${cat.slug}`)}
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/category/all" className={navLink("/category/all", pathname === "/category/all")}>
              Shop all
            </Link>
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              title="Search ( / )"
              className={`${iconBtn} xl:w-auto xl:px-4 xl:gap-2.5 xl:border xl:border-line xl:bg-card xl:hover:border-gold xl:hover:bg-card`}
            >
              <Search className="h-[19px] w-[19px]" strokeWidth={1.75} />
              <span className="hidden xl:inline font-sans text-[13px] text-muted pr-6">Search gifts…</span>
            </button>
            <Link href="/wishlist" aria-label="Wishlist" className={`${iconBtn} hidden sm:flex`}>
              <Heart className="h-[19px] w-[19px]" strokeWidth={1.75} />
              <CountBadge count={wishlist.items.length} />
            </Link>
            <Link
              href={accountHref(!!user, pathname)}
              aria-label={user ? "My account" : "Sign in"}
              className={`${iconBtn} hidden lg:flex`}
            >
              <User className="h-[19px] w-[19px]" strokeWidth={1.75} />
            </Link>
            <Link href="/cart" aria-label={`Bag, ${count} items`} className={iconBtn}>
              <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={1.75} />
              <CountBadge count={count} />
            </Link>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}

export function MobileBottomNav() {
  const { count } = useCart();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const pathname = usePathname();

  if (hasOwnMobileBar(pathname)) return null;

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/category/all", label: "Shop", icon: LayoutGrid, active: pathname.startsWith("/category") },
    { href: "/wishlist", label: "Wishlist", icon: Heart, active: pathname === "/wishlist", badge: wishlist.items.length },
    { href: "/cart", label: "Bag", icon: ShoppingBag, active: false, badge: count },
    {
      href: accountHref(!!user, pathname),
      label: "Account",
      icon: User,
      active: pathname.startsWith("/profile") || pathname.startsWith("/login") || pathname === "/track",
    },
  ];

  return (
    <nav
      aria-label="Tabs"
      className="lg:hidden fixed bottom-0 inset-x-0 z-nav bg-emerald/[0.97] backdrop-blur-md border-t border-emerald-light pb-safe"
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, active, badge }) => (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center gap-1 pt-2.5 pb-2 transition-colors ${
              active ? "text-gold" : "text-sand-dim/80 hover:text-sand"
            }`}
          >
            <span
              className={`absolute top-0 h-[2px] w-8 rounded-full bg-gold transition-transform duration-300 ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
            <span className="relative">
              <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2 : 1.6} />
              {!!badge && <CountBadge count={badge} tone="gold" />}
            </span>
            <span className="font-sans text-[10px] tracking-wide">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function WhatsAppButton() {
  const settings = useSettings();
  const pathname = usePathname();
  const { lastAdded } = useCart();
  const number = settings.whatsapp?.replace(/\D/g, "");
  // Step aside while the "added to bag" bar is up — they share the bottom edge.
  if (!number || lastAdded) return null;

  const onActionPage = hasOwnMobileBar(pathname);

  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(`Assalamu Alaikum, I have a question about a gift on ${settings.storeName}.`)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`fixed right-4 lg:right-6 bottom-[84px] lg:bottom-6 z-nav h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_-10px_rgba(10,46,34,0.6)] hover:scale-105 active:scale-95 transition-transform ${
        onActionPage ? "hidden lg:flex" : "flex"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 lg:h-7 lg:w-7" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.45-5.02c0-5.2 4.24-9.44 9.45-9.44a9.38 9.38 0 0 1 9.44 9.45c0 5.21-4.24 9.44-9.45 9.44m8.04-17.48A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.07c0 2 .52 3.96 1.52 5.68L.58 23.7l6.09-1.6a11.3 11.3 0 0 0 5.38 1.37h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.9-3.34-8.05" />
      </svg>
    </a>
  );
}

export function Footer() {
  const settings = useSettings();
  const categories = useNavCategories();

  const socials = [
    { label: "Instagram", href: settings.instagram },
    { label: "Facebook", href: settings.facebook },
    { label: "YouTube", href: settings.youtube },
  ].filter((s) => s.href);

  const link = "text-[#cdd8cf] hover:text-gold transition-colors py-0.5";

  return (
    <footer className="bg-emerald-deep text-[#cdd8cf] pb-24 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 md:px-7 pt-14 pb-10 grid grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-x-6 gap-y-10">
        <div className="col-span-2 lg:col-span-1">
          <Brand dark />
          <p className="font-display italic text-lg leading-relaxed text-[#9fb2a4] mt-5 max-w-[300px]">
            Share the barakah — thoughtful Islamic gifts, handcrafted with love and delivered worldwide.
          </p>
          {socials.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-5 font-sans text-xs tracking-[0.08em] uppercase">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-light transition">
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="font-sans text-xs tracking-[0.16em] uppercase text-cream mb-4">Shop</p>
          <div className="flex flex-col gap-2 font-sans text-sm">
            {categories.slice(0, 6).map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className={link}>
                {cat.name}
              </Link>
            ))}
            <Link href="/category/all" className={link}>All gifts</Link>
          </div>
        </div>
        <div>
          <p className="font-sans text-xs tracking-[0.16em] uppercase text-cream mb-4">Help</p>
          <div className="flex flex-col gap-2 font-sans text-sm">
            <Link href="/faq" className={link}>FAQs</Link>
            <Link href="/track" className={link}>Track order</Link>
            <Link href="/contact" className={link}>Contact us</Link>
            <Link href="/faq#policies" className={link}>Shipping &amp; returns</Link>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="font-sans text-xs tracking-[0.16em] uppercase text-cream mb-4">Company</p>
          <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 font-sans text-sm">
            <Link href="/about" className={link}>About us</Link>
            <Link href="/contact" className={link}>Bulk &amp; corporate</Link>
            <Link href="/faq#policies" className={link}>Privacy policy</Link>
            <Link href="/faq#policies" className={link}>Terms &amp; conditions</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[#12402f]">
        <div className="mx-auto max-w-7xl px-4 md:px-7 py-5 flex flex-col sm:flex-row sm:flex-wrap justify-between gap-2.5 font-sans text-xs text-[#7f9488]">
          <span>
            © {new Date().getFullYear()} {settings.storeName} Gifting. All rights reserved.
          </span>
          <span>Secure payments by Razorpay · UPI, cards &amp; netbanking</span>
        </div>
      </div>
    </footer>
  );
}
