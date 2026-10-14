"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useStandalone } from "@/hooks/use-standalone";
import { AddedToBagBar } from "@/components/cart/added-to-bag-bar";
import {
  AnnouncementBar,
  Footer,
  Header,
  MobileBottomNav,
  WhatsAppButton,
  hasOwnMobileBar,
} from "@/components/layout/site-chrome";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Installed PWA gets an app-like chrome: bottom nav only, no marketing footer.
  const standalone = useStandalone();
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col bg-cream">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-toast focus:bg-emerald focus:text-cream focus:px-4 focus:py-2 focus:rounded-sm font-sans text-sm"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      {/* Mobile: leave room for the tab bar or the page's own sticky action bar. */}
      <main
        id="main"
        className={`flex flex-1 flex-col lg:pb-0 ${hasOwnMobileBar(pathname) ? "pb-28" : "pb-20"}`}
      >
        {children}
      </main>
      {!standalone && <Footer />}
      <MobileBottomNav />
      <WhatsAppButton />
      <AddedToBagBar />
    </div>
  );
}
