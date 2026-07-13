"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { useRouter } from "next/navigation";
import Script from "next/script";
import api from "@/lib/api";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, total, checkout, clearCart } = useCart();
  const settings = useSettings();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", address: "", note: "" });
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name === "Customer" ? "" : user.name || "",
        address: (user as any).address || "",
      }));
    }
  }, [user]);

  // Validate the coupon applied in the cart
  useEffect(() => {
    const saved = localStorage.getItem("arvion_coupon");
    if (!saved || total === 0) return;
    api
      .post("/coupons/validate", { code: saved, subtotal: total })
      .then((res) => setCoupon({ code: res.data.code, discount: res.data.discount }))
      .catch(() => {
        setCoupon(null);
        localStorage.removeItem("arvion_coupon");
      });
  }, [total]);

  // If unauthenticated or no items, bounce back
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login/customer?redirect=/checkout");
    } else if (items.length === 0) {
      router.push("/cart");
    }
  }, [user, authLoading, items, router]);

  const discount = coupon?.discount || 0;
  const freeThreshold = Number(settings.freeShippingThreshold) || 0;
  const shippingFee = Number(settings.shippingFee) || 0;
  const shipping = total - discount >= freeThreshold ? 0 : shippingFee;
  const grandTotal = Math.max(0, total - discount + shipping);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      setError("Please provide your name and delivery address.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const shippingAddress = formData.note
        ? `${formData.address}\n\nGift note: ${formData.note}`
        : formData.address;

      const checkoutData = await checkout({
        customerName: formData.name,
        shippingAddress,
        couponCode: coupon?.code,
      });

      const options = {
        key: checkoutData.key,
        amount: checkoutData.amount * 100,
        currency: checkoutData.currency,
        name: settings.storeName,
        description: "Order Payment",
        order_id: checkoutData.razorpayOrderId,
        handler: async function (response: any) {
          try {
            await api.post("/orders/verify-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            localStorage.removeItem("arvion_coupon");
            window.location.href = `/order-success?order=${checkoutData.orderId}`;
          } catch (err: any) {
            alert(
              "We received your payment but could not confirm it instantly. " +
                (err.response?.data?.message || "")
            );
            window.location.href = "/";
          }
        },
        prefill: {
          name: formData.name,
          contact: (user as any)?.phone || "",
        },
        theme: {
          color: "#0d3b2c",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err: any) {
      setError("Checkout failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) return null;

  const inputClass =
    "w-full font-sans text-sm px-4 py-3 border border-line bg-card rounded-sm text-ink placeholder:text-muted-2 focus:outline-none focus:border-gold transition";

  return (
    <div className="mx-auto max-w-5xl w-full px-4 md:px-7 py-8 md:py-10 flex-1">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <h1 className="font-display font-medium text-4xl md:text-[46px] text-ink mb-7">
        Checkout
      </h1>

      <form
        onSubmit={handlePayNow}
        className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-8 items-start"
      >
        {/* Delivery details */}
        <div className="flex flex-col gap-6">
          <div className="border border-line rounded bg-card p-5 md:p-6">
            <h2 className="font-display font-medium text-2xl text-ink mb-5">
              Delivery Details
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block font-sans text-xs tracking-[0.1em] uppercase text-emerald mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block font-sans text-xs tracking-[0.1em] uppercase text-emerald mb-1.5">
                  Delivery Address
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House / flat, street, city, state, PIN code"
                  rows={3}
                  className={`${inputClass} resize-y`}
                />
              </div>
              <div>
                <label className="block font-sans text-xs tracking-[0.1em] uppercase text-emerald mb-1.5">
                  ✦ Gift note (optional)
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="A short message or name to include"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Items recap */}
          <div className="border border-line rounded bg-card overflow-hidden">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-line-soft last:border-b-0"
              >
                <div className="w-12 h-12 rounded-sm overflow-hidden bg-paper border border-line-soft flex-none">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[repeating-linear-gradient(135deg,#efe7d4_0_8px,#f5eede_8px_16px)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base text-ink truncate">{item.title}</p>
                  <p className="font-sans text-xs text-muted">Qty {item.quantity}</p>
                </div>
                <span className="font-sans text-sm font-medium text-emerald">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + pay */}
        <div className="border border-line rounded bg-paper p-6 lg:sticky lg:top-28">
          <h3 className="font-display font-medium text-2xl text-ink mb-5">
            Order Summary
          </h3>
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
          <div className="border-t border-line my-4" />
          <div className="flex justify-between font-display text-2xl text-emerald mb-5">
            <span>Total</span>
            <span>₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>
          {error && (
            <p className="font-sans text-xs text-danger mb-4">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-emerald font-sans text-[13px] tracking-[0.12em] uppercase py-3.5 rounded-sm hover:bg-gold-light transition disabled:opacity-50"
          >
            {loading ? "Preparing payment…" : "Pay Securely"}
          </button>
          <p className="font-sans text-[11px] text-muted text-center mt-3">
            Secured by Razorpay · UPI, cards &amp; netbanking
          </p>
        </div>
      </form>
    </div>
  );
}
