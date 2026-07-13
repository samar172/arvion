"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import api from "@/lib/api";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, total } = useCart();
  const { user } = useAuth();
  const settings = useSettings();
  const router = useRouter();

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applying, setApplying] = useState(false);

  // Restore a previously applied coupon
  useEffect(() => {
    const saved = localStorage.getItem("arvion_coupon");
    if (saved) setCouponInput(saved);
  }, []);

  // Re-validate whenever the cart total changes
  useEffect(() => {
    if (!coupon) return;
    if (items.length === 0) {
      setCoupon(null);
      return;
    }
    api
      .post("/coupons/validate", { code: coupon.code, subtotal: total })
      .then((res) => setCoupon({ code: res.data.code, discount: res.data.discount }))
      .catch((err) => {
        setCoupon(null);
        setCouponError(err.response?.data?.message || "Coupon no longer valid");
        localStorage.removeItem("arvion_coupon");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    setCouponError("");
    try {
      const res = await api.post("/coupons/validate", { code, subtotal: total });
      setCoupon({ code: res.data.code, discount: res.data.discount });
      localStorage.setItem("arvion_coupon", res.data.code);
    } catch (err: any) {
      setCoupon(null);
      setCouponError(err.response?.data?.message || "Invalid coupon code");
      localStorage.removeItem("arvion_coupon");
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
    localStorage.removeItem("arvion_coupon");
  };

  const discount = coupon?.discount || 0;
  const freeThreshold = Number(settings.freeShippingThreshold) || 0;
  const shippingFee = Number(settings.shippingFee) || 0;
  const shipping = total - discount >= freeThreshold || items.length === 0 ? 0 : shippingFee;
  const grandTotal = Math.max(0, total - discount + shipping);

  const handleCheckout = () => {
    if (!user) {
      router.push("/login/customer?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className="mx-auto max-w-5xl w-full px-4 md:px-7 py-8 md:py-10 flex-1">
      <h1 className="font-display font-medium text-4xl md:text-[46px] text-ink mb-7">
        Your Bag
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16 md:py-20 px-5 border border-line rounded bg-card">
          <p className="font-display text-2xl md:text-[26px] text-ink-soft mb-2">
            Your bag is empty
          </p>
          <p className="font-sans text-sm text-muted mb-6">
            Discover thoughtful gifts curated with love.
          </p>
          <Link
            href="/category/all"
            className="inline-block bg-emerald text-cream font-sans text-[13px] tracking-[0.1em] uppercase px-8 py-3.5 rounded-sm hover:bg-emerald-light transition"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-8 items-start">
          {/* Items */}
          <div className="border border-line rounded overflow-hidden bg-card">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-4 md:gap-5 p-4 md:p-5 border-b border-line-soft last:border-b-0 items-center"
              >
                <Link
                  href={`/products/${item.productId}`}
                  className="w-20 h-20 md:w-[88px] md:h-[88px] flex-none rounded-sm overflow-hidden bg-paper border border-line-soft"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[repeating-linear-gradient(135deg,#efe7d4_0_12px,#f5eede_12px_24px)]" />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-display text-lg md:text-[21px] text-ink leading-tight line-clamp-2"
                  >
                    {item.title}
                  </Link>
                  <div className="font-sans text-[13px] text-muted mt-1">
                    ₹{item.price.toLocaleString("en-IN")} each
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="mt-2 font-sans text-xs text-danger underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex flex-col md:flex-row items-end md:items-center gap-3 md:gap-5">
                  <div className="flex items-center border border-line rounded-sm">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 md:w-[34px] md:h-[34px] text-emerald"
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="font-sans text-sm min-w-[26px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 md:w-[34px] md:h-[34px] text-emerald"
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <div className="font-sans text-[15px] md:text-base font-medium text-emerald min-w-[80px] text-right">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="border border-line rounded bg-paper p-6 lg:sticky lg:top-28">
            <h3 className="font-display font-medium text-2xl text-ink mb-5">
              Order Summary
            </h3>

            {/* Coupon */}
            <div className="mb-5">
              {coupon ? (
                <div className="flex items-center justify-between bg-card border border-gold rounded-sm px-3.5 py-2.5">
                  <span className="font-sans text-sm text-emerald">
                    ✦ <span className="font-medium">{coupon.code}</span> applied
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="font-sans text-xs text-danger underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="flex-1 min-w-0 font-sans text-sm px-3.5 py-2.5 border border-line bg-card rounded-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-gold uppercase"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={applying || !couponInput.trim()}
                    className="font-sans text-xs tracking-[0.08em] uppercase bg-emerald text-cream px-4 rounded-sm disabled:opacity-40"
                  >
                    {applying ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="font-sans text-xs text-danger mt-2">{couponError}</p>
              )}
            </div>

            <div className="flex justify-between font-sans text-sm text-ink-body mb-3">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between font-sans text-sm text-emerald mb-3">
                <span>Discount ({coupon?.code})</span>
                <span>−₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between font-sans text-sm text-ink-body mb-3">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
            </div>
            {shipping > 0 && (
              <p className="font-sans text-[11px] text-muted mb-3">
                Add ₹{(freeThreshold - (total - discount)).toLocaleString("en-IN")} more for free shipping
              </p>
            )}
            <div className="border-t border-line my-4" />
            <div className="flex justify-between font-display text-2xl text-emerald mb-5">
              <span>Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-emerald text-cream font-sans text-[13px] tracking-[0.12em] uppercase py-3.5 rounded-sm hover:bg-emerald-light transition"
            >
              Checkout
            </button>
            <Link
              href="/category/all"
              className="block text-center w-full mt-3 border border-line text-emerald font-sans text-[13px] tracking-[0.08em] uppercase py-3 rounded-sm hover:border-gold transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
