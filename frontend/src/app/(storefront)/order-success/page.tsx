"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { OrderTimeline } from "@/components/order/order-timeline";

function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center py-32">
      <p className="font-display italic text-xl text-muted animate-pulse">
        Confirming your order…
      </p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrderSuccess />
    </Suspense>
  );
}

function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    api
      .get("/orders/my-orders")
      .then((res) => setOrder(res.data.find((o: any) => o.id === orderId) || null))
      .catch((err) => console.error("Failed to load order", err))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <Loading />;

  const subtotal = order?.subtotalAmount ? parseFloat(order.subtotalAmount) : null;
  const discount = order?.discountAmount ? parseFloat(order.discountAmount) : 0;
  const totalAmount = order ? parseFloat(order.totalAmount) : 0;
  const shipping =
    subtotal !== null ? Math.max(0, totalAmount - (subtotal - discount)) : 0;

  return (
    <div className="mx-auto max-w-3xl w-full px-4 md:px-7 py-12 md:py-16 flex-1">
      {/* Confirmation header */}
      <div className="text-center mb-10">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald text-sand flex items-center justify-center text-2xl mb-5">
          ✦
        </div>
        <p className="font-sans text-[11px] tracking-[0.28em] uppercase text-gold-muted mb-2.5">
          Jazakallah Khair
        </p>
        <h1 className="font-display font-medium text-4xl md:text-[46px] leading-tight text-ink">
          Your order is confirmed
        </h1>
        <p className="font-sans font-light text-[15px] text-muted mt-3 max-w-md mx-auto leading-relaxed">
          {order?.customerName ? `Thank you, ${order.customerName}. ` : "Thank you. "}
          We&apos;re wrapping your gift with care and will keep you posted on WhatsApp.
        </p>
        {orderId && (
          <div className="inline-flex items-center gap-2 mt-5 border border-line bg-card rounded-sm px-4 py-2.5">
            <span className="font-sans text-xs tracking-[0.1em] uppercase text-muted">
              Order
            </span>
            <span className="font-mono text-xs text-emerald">
              {orderId.slice(0, 8).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {order && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Timeline */}
          <div className="border border-line rounded bg-card p-6">
            <h2 className="font-display font-medium text-2xl text-ink mb-5">
              Order Status
            </h2>
            <OrderTimeline status={order.status} />
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-6">
            <div className="border border-line rounded bg-card overflow-hidden">
              {order.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-line-soft last:border-b-0"
                >
                  <div className="w-12 h-12 rounded-sm overflow-hidden bg-paper border border-line-soft flex-none">
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
                    <p className="font-display text-base text-ink truncate">
                      {item.product?.title || "Item"}
                    </p>
                    <p className="font-sans text-xs text-muted">Qty {item.quantity}</p>
                  </div>
                  <span className="font-sans text-sm font-medium text-emerald">
                    ₹{(parseFloat(item.price) * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="border border-line rounded bg-paper p-6">
              {subtotal !== null && (
                <div className="flex justify-between font-sans text-sm text-ink-body mb-3">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between font-sans text-sm text-emerald mb-3">
                  <span>Discount ({order.couponCode})</span>
                  <span>−₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {subtotal !== null && (
                <div className="flex justify-between font-sans text-sm text-ink-body mb-3">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
              )}
              <div className="border-t border-line my-4" />
              <div className="flex justify-between font-display text-2xl text-emerald">
                <span>Paid</span>
                <span>₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
              {order.shippingAddress && (
                <div className="mt-5 pt-5 border-t border-line">
                  <p className="font-sans text-xs tracking-[0.1em] uppercase text-emerald mb-1.5">
                    Delivering to
                  </p>
                  <p className="font-sans font-light text-[13px] text-ink-body whitespace-pre-line leading-relaxed">
                    {order.shippingAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/track"
          className="text-center border border-line text-emerald font-sans text-[13px] tracking-[0.1em] uppercase px-8 py-3.5 rounded-sm hover:border-gold transition"
        >
          Track Order
        </Link>
        <Link
          href="/category/all"
          className="text-center bg-emerald text-cream font-sans text-[13px] tracking-[0.1em] uppercase px-8 py-3.5 rounded-sm hover:bg-emerald-light transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
