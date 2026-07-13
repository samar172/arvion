"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <Image
          src="/logo.png"
          alt=""
          width={942}
          height={957}
          priority
          className="h-11 w-auto shrink-0"
        />
        <div>
          <div className="font-display text-2xl tracking-[0.22em] text-white">
            AL-RIZVI
          </div>
          <div className="text-[9px] tracking-[0.42em] uppercase text-sidebar-primary mt-1">
            Admin Panel
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4 no-scrollbar">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-white font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 flex-none" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-6 py-4 border-t border-sidebar-border text-[11px] text-sidebar-foreground/40">
        Share the barakah ✦
      </div>
    </div>
  );
}
