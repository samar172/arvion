"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Script from "next/script";
import api from "@/lib/api";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, total, checkout, clearCart } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name === "Customer" ? "" : user.name || "",
        address: user.address || "", // Will exist if we added it to the model and returned it
      });
    }
  }, [user]);

  // If unauthenticated or no items, bounce back
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login/customer?redirect=/checkout");
    } else if (items.length === 0) {
      router.push("/cart");
    }
  }, [user, authLoading, items, router]);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address) {
      alert("Please provide your name and delivery address.");
      return;
    }

    try {
      setLoading(true);
      
      // We pass the collected details to the checkout API
      // We need to modify our context/API to accept delivery details
      const checkoutData = await checkout({
        customerName: formData.name,
        shippingAddress: formData.address,
      });

      const options = {
        key: checkoutData.key,
        amount: checkoutData.amount * 100,
        currency: checkoutData.currency,
        name: "Arvion",
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
          contact: user?.phone || "",
        },
        theme: {
          color: "#065f46",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (err: any) {
      alert("Checkout failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) return null;

  return (
    <div className="flex-1 w-full bg-surface pb-safe pt-md">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="max-w-3xl mx-auto px-container-margin">
        <h1 className="text-display-sm font-extrabold text-on-surface mb-6">Checkout</h1>
        
        <form onSubmit={handlePayNow} className="space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant space-y-4">
            <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              Delivery Details
            </h2>
            
            <div>
              <label className="block text-label-lg font-bold text-on-surface mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full bg-surface rounded-xl px-4 py-3 text-body-lg text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            
            <div>
              <label className="block text-label-lg font-bold text-on-surface mb-1">Delivery Address</label>
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full delivery address, floor, building..."
                rows={3}
                className="w-full bg-surface rounded-xl px-4 py-3 text-body-lg text-on-surface border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant space-y-4">
            <h2 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              Order Summary
            </h2>
            
            <div className="space-y-2 text-body-md text-on-surface">
              <div className="flex justify-between">
                <span>Items ({items.length})</span>
                <span className="font-bold">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-bold text-primary">Free</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST)</span>
                <span className="font-bold">₹{(total * 0.05).toFixed(2)}</span>
              </div>
              <div className="border-t border-outline-variant pt-2 mt-2 flex justify-between items-end">
                <span className="font-bold">Total Amount</span>
                <span className="text-title-xl font-extrabold text-primary">₹{(total * 1.05).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-title-md shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? "Processing..." : "Pay Now"}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  );
}
