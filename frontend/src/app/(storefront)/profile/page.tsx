"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import { StatusBadge } from "@/components/order/order-timeline";

const inputClass =
  "w-full font-sans text-sm px-4 py-3 border border-line bg-card rounded-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-gold transition";
const labelClass =
  "block font-sans text-xs tracking-[0.1em] uppercase text-emerald mb-1.5";

export default function ProfilePage() {
  const { user, loading: authLoading, logout, updateUser } = useAuth();
  const toast = useToast();
  const router = useRouter();

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

  if (authLoading || !user) return null;

  const initial = (name || "A").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-5xl w-full px-4 md:px-7 py-8 md:py-12 flex-1">
      <p className="font-sans text-[11px] tracking-[0.28em] uppercase text-gold-muted mb-2.5">
        Assalamu Alaikum
      </p>
      <h1 className="font-display font-medium text-4xl md:text-[46px] text-ink mb-7">
        My Account
      </h1>

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
                className="w-full bg-emerald text-cream font-sans text-[13px] tracking-[0.12em] uppercase py-3 rounded-sm hover:bg-emerald-light transition disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>

          <button
            onClick={() => logout()}
            className="w-full border border-line text-danger font-sans text-[13px] tracking-[0.1em] uppercase py-3 rounded-sm hover:border-danger transition"
          >
            Sign Out
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
            <div className="py-20 text-center font-display italic text-lg text-muted animate-pulse">
              Loading orders…
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
                  className="border border-line rounded bg-card px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
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
