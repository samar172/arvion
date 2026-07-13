"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.replace(searchParams.get("redirect") || "/");
    } catch (err: any) {
      setError(err.message === "This account does not have admin access."
        ? err.message
        : apiError(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-12">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt=""
            width={942}
            height={957}
            priority
            className="h-16 w-auto shrink-0"
          />
          <div>
            <div className="font-display text-3xl tracking-[0.22em] text-white">
              AL-RIZVI
            </div>
            <div className="text-[10px] tracking-[0.42em] uppercase text-primary mt-1.5">
              Islamic Gifting
            </div>
          </div>
        </div>
        <div>
          <h1 className="font-display text-4xl leading-tight text-white mb-3">
            Store Control Center
          </h1>
          <p className="text-sm text-sidebar-foreground/70 max-w-sm leading-relaxed">
            Manage products, orders, banners, coupons and every detail of your
            storefront — all in one place.
          </p>
        </div>
        <div className="text-xs text-sidebar-foreground/40">
          ✦ Secured admin access
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <Image
              src="/logo.png"
              alt=""
              width={942}
              height={957}
              priority
              className="h-16 w-auto mx-auto mb-3"
            />
            <div className="font-display text-2xl tracking-[0.22em] text-primary">
              AL-RIZVI
            </div>
          </div>
          <h2 className="font-display text-3xl text-foreground mb-1.5">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            Sign in to your admin account to continue.
          </p>

          {error && (
            <div className="mb-5 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@al-rizvi.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
