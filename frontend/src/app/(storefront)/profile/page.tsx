"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { StatusBadge } from "@/components/order/order-timeline";
import { useWishlist } from "@/context/WishlistContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, LifeBuoy, LogOut, PackageSearch } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";

const inputClass = "field";
const labelClass = "field-label";

export default function ProfilePage() {
  const { user, loading: authLoading, logout, updateUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const wishlist = useWishlist();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/customer?redirect=/profile");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name === "Customer" ? "" : user.name || "");
    setAddress((user as any).address || "");
    api
      .get("/orders/my-orders")
      .then((res) => setOrders(res.data || []))
      .catch((err) => console.error("Failed to fetch orders", err))
      .finally(() => setLoadingOrders(false));
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/auth/profile", { name, address });
      updateUser({ name, address });
      toast("Profile updated");
    } catch (err) {
      console.error(err);
      toast("Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-5xl w-full px-4 md:px-7 py-8 md:py-12 flex-1">
        <Skeleton className="h-10 w-56 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const initial = (name || "A").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-5xl w-full px-4 md:px-7 py-8 md:py-12 flex-1">
      <p className="font-sans text-[11px] tracking-[0.28em] uppercase text-gold-muted mb-2.5">
        Assalamu Alaikum
      </p>
      <h1 className="font-display font-medium text-[38px] md:text-[52px] leading-tight text-ink mb-6">
        My account
      </h1>

      <div className="grid grid-cols-3 gap-2.5 md:gap-4 mb-8">
        {[
          { href: "/track", icon: PackageSearch, label: "Track orders", sub: `${orders.length} placed` },
          { href: "/wishlist", icon: Heart, label: "Wishlist", sub: `${wishlist.items.length} saved` },
          { href: "/contact", icon: LifeBuoy, label: "Get help", sub: "We reply fast" },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-4 rounded-md border border-line bg-card px-3 py-4 md:px-5 md:py-5 text-center md:text-left hover:border-gold hover:-translate-y-0.5 transition"
          >
            <span className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-paper border border-line text-gold-dark group-hover:bg-emerald group-hover:text-gold group-hover:border-emerald transition">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </span>
            <span>
              <span className="block font-sans text-[13px] md:text-sm text-ink">{label}</span>
              <span className="block font-sans text-[11px] md:text-xs text-muted">{loadingOrders && href === "/track" ? "…" : sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
        {/* Account card + details form */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-28">
          <div className="border border-line rounded bg-card p-6">
            <div className="flex items-center gap-4 pb-5 mb-5 border-b border-line-soft">
              <div className="w-14 h-14 rounded-full bg-emerald text-sand flex items-center justify-center font-display text-2xl flex-none">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl text-ink truncate">
                  {name || "Welcome"}
                </p>
                <p className="font-sans text-[13px] text-muted truncate">
                  {(user as any).phone || user.email || ""}
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Delivery Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / flat, street, city, state, PIN code"
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
              </div>
              <button
                type="submit"
                disabled={saving || !name || !address}
                className="btn-primary w-full"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>

          <button
            onClick={() => logout()}
            className="btn w-full border border-line text-danger hover:border-danger"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} /> Sign out
          </button>
        </div>

        {/* Order history */}
        <div>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display font-medium text-2xl md:text-[30px] text-ink">
              Order History
            </h2>
            <Link
              href="/track"
              className="font-sans text-xs tracking-[0.08em] uppercase text-emerald border-b border-gold pb-0.5"
            >
              Track
            </Link>
          </div>

          {loadingOrders ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-md" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-5 border border-line rounded bg-card">
              <p className="font-display text-2xl text-ink-soft mb-2">No orders yet</p>
              <p className="font-sans text-sm text-muted mb-6">
                Your gifting journey begins here.
              </p>
              <Link
                href="/category/all"
                className="inline-block bg-emerald text-cream font-sans text-[13px] tracking-[0.1em] uppercase px-8 py-3.5 rounded-sm hover:bg-emerald-light transition"
              >
                Explore Gifts
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-line rounded-md bg-card px-4 md:px-5 py-4 flex items-center justify-between gap-4 hover:border-gold/60 transition"
                >
                  <div className="hidden sm:flex -space-x-3 shrink-0">
                    {order.items?.slice(0, 3).map((item: any) => (
                      <span key={item.id} className="h-12 w-12 rounded-md overflow-hidden border-2 border-card bg-paper">
                        {item.product?.imageUrl ? (
                          <SafeImage src={item.product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="block h-full w-full pattern-paper" />
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-muted-2 mb-1">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-display text-lg text-ink">
                      ₹{parseFloat(order.totalAmount).toLocaleString("en-IN")}
                    </p>
                    <p className="font-sans text-xs text-muted mt-0.5">
                      {order.items?.length || 0} item
                      {order.items?.length === 1 ? "" : "s"} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-none">
                    <StatusBadge status={order.status} />
                    <Link
                      href={`/order-success?order=${order.id}`}
                      className="font-sans text-xs text-emerald border-b border-gold pb-0.5"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
