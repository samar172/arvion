"use client";

import { useAuth } from "@/context/AuthContext";
import { SidebarNav } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  // The middleware already gates on the cookie; this guards the brief window
  // before the profile check resolves and covers a stale/invalid token.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground font-display text-xl animate-pulse">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden lg:block h-screen sticky top-0">
        <SidebarNav />
      </aside>
      <div className="flex min-h-screen flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-8 bg-background">{children}</main>
      </div>
    </div>
  );
}
