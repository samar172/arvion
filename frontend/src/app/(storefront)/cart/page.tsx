"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ShoppingBag, Package, Trash2 } from "lucide-react";
import api from "@/lib/api";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, total, checkout, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      router.push('/login/customer?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex-1 w-full text-center flex flex-col items-center space-y-6">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-amber-50 text-amber-500 ring-1 ring-amber-100">
          <ShoppingBag className="h-11 w-11" strokeWidth={1.75} />
        </span>
        <h2 className="text-2xl font-display font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-500">Looks like you haven't added anything yet.</p>
        <Link href="/" className="inline-block mt-4 bg-brand-emerald text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-800 transition">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Your Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-100">
                {item.imageUrl ? (
                   <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                   <Package className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-2">{item.title}</h3>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} aria-label="Remove item" className="text-gray-400 hover:text-red-500 transition-colors p-1 -m-1">
                    <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
                  </button>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-9">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-3 text-gray-600 hover:text-brand-emerald font-bold"
                    >
                      -
                    </button>
                    <span className="px-2 font-bold text-gray-900 text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="px-3 text-gray-600 hover:text-brand-emerald font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-extrabold text-brand-emerald">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 sticky top-8 space-y-6">
            <h3 className="text-xl font-display font-bold text-gray-900">Order Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                <span className="font-bold text-gray-900">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="font-bold text-emerald-600">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (GST)</span>
                <span className="font-bold text-gray-900">₹{(total * 0.05).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 flex justify-between items-end">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-2xl font-extrabold text-brand-emerald">₹{(total * 1.05).toFixed(2)}</span>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-brand-emerald text-white font-bold py-4 rounded-xl hover:bg-emerald-800 transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? "Processing..." : "Proceed to Checkout"}
            </button>
            
            <p className="text-xs text-center text-gray-500 font-medium">
              By proceeding, you agree to Arvion's Terms & Conditions. Secure payment powered by Razorpay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
