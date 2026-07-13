"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { NAV_ITEMS } from "./nav";
import { SidebarNav } from "./sidebar";

function useTitle() {
  const pathname = usePathname();
  const match = NAV_ITEMS.filter((n) => n.href !== "/").find((n) =>
    pathname.startsWith(n.href)
  );
  if (pathname === "/") return "Dashboard";
  return match?.label ?? "Admin";
}

export function Topbar() {
  const { user, logout } = useAuth();
  const title = useTitle();
  const [open, setOpen] = useState(false);
  const initial = (user?.name || "A").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b bg-background/90 backdrop-blur px-4 md:px-8 h-16">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <h1 className="font-display text-2xl text-foreground">{title}</h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none">
            <Avatar className="h-9 w-9 border">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initial}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="font-medium">{user?.name || "Admin"}</div>
            <div className="text-xs text-muted-foreground font-normal truncate">
              {user?.email}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
