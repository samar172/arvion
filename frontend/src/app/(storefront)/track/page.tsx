"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { OrderTimeline, StatusBadge } from "@/components/order/order-timeline";

export default function TrackOrderPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login/customer?redirect=/track");
      return;
    }
    api
      .get("/orders/my-orders")
      .then((res) => {
        setOrders(res.data || []);
        if (res.data?.length) setOpenId(res.data[0].id);
      })
      .catch((err) => console.error("Failed to load orders", err))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl w-full px-4 md:px-7 py-8 md:py-12 flex-1">
      <p className="font-sans text-[11px] tracking-[0.28em] uppercase text-gold-muted mb-2.5">
        Your Orders
      </p>
      <h1 className="font-display font-medium text-4xl md:text-[46px] text-ink mb-7">
        Track Order
      </h1>

      {loading ? (
        <div className="py-24 text-center font-display italic text-lg text-muted animate-pulse">
          Fetching your orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 md:py-20 px-5 border border-line rounded bg-card">
          <p className="font-display text-2xl md:text-[26px] text-ink-soft mb-2">
            No orders yet
          </p>
          <p className="font-sans text-sm text-muted mb-6">
            When you place an order, you can follow it here.
          </p>
          <Link
            href="/category/all"
            className="inline-block bg-emerald text-cream font-sans text-[13px] tracking-[0.1em] uppercase px-8 py-3.5 rounded-sm hover:bg-emerald-light transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const open = openId === order.id;
            const placed = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            return (
              <div key={order.id} className="border border-line rounded bg-card overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : order.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-2 mb-1">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-display text-lg text-ink">
                      ₹{parseFloat(order.totalAmount).toLocaleString("en-IN")}{" "}
                      <span className="font-sans text-[13px] text-muted">
                        · {order.items?.length || 0} item
                        {order.items?.length === 1 ? "" : "s"} · {placed}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-none">
                    <StatusBadge status={order.status} />
                    <span className="text-emerald text-sm">{open ? "−" : "+"}</span>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-line-soft px-5 py-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <OrderTimeline status={order.status} />
                    <div>
                      <p className="font-sans text-xs tracking-[0.1em] uppercase text-emerald mb-3">
                        Items
                      </p>
                      <div className="flex flex-col gap-3 mb-5">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-sm overflow-hidden bg-paper border border-line-soft flex-none">
                              {item.product?.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.product.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[repeating-linear-gradient(135deg,#efe7d4_0_8px,#f5eede_8px_16px)]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display text-[15px] text-ink truncate">
                                {item.product?.title || "Item"}
                              </p>
                              <p className="font-sans text-xs text-muted">
                                Qty {item.quantity} · ₹
                                {parseFloat(item.price).toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.shippingAddress && (
                        <>
                          <p className="font-sans text-xs tracking-[0.1em] uppercase text-emerald mb-1.5">
                            Delivering to
                          </p>
                          <p className="font-sans font-light text-[13px] text-ink-body whitespace-pre-line leading-relaxed">
                            {order.shippingAddress}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
