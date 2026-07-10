"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight, MapPin, Phone, Truck, Receipt, Calendar } from "lucide-react";
import api from "@/lib/api";

const STATUS_STEPS = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'DELIVERED', label: 'Delivered' },
];

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await api.get("/orders/my-orders");
        const found = res.data.find((o: any) => o.id === orderId);
        setOrder(found || null);
      } catch (err) {
        console.error("Failed to load order", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  // If order is missing, show a simplified success state
  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex-1 w-full text-center flex flex-col items-center space-y-6">
        <span className="grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
          <CheckCircle2 className="h-12 w-12" strokeWidth={1.75} />
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-gray-900">Payment Successful</h1>
          <p className="text-gray-500">Thank you for your order — your attars are being prepared with care.</p>
        </div>
        {orderId && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm">
            <Package className="h-4 w-4 text-amber-500" strokeWidth={2.25} />
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono font-bold text-gray-800">{orderId}</span>
          </div>
        )}
        <div className="pt-2">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-bold text-white transition hover:bg-gray-800">
            Continue Shopping
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status) || 0;
  // If status is failed or cancelled, we don't show the tracking bar normally
  const isFailed = order.status === 'FAILED' || order.status === 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
      <div className="text-center mb-10">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100 mb-6">
          <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
        </span>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-gray-900 mb-3">Order Confirmed!</h1>
        <p className="text-gray-500 text-lg">Thank you, {order.customerName || 'Customer'}. Your order is confirmed.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {/* Tracking Header */}
        <div className="bg-gray-50/50 p-6 md:p-8 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Order Number</p>
              <p className="font-mono font-bold text-gray-900">{order.id}</p>
            </div>
            <div className="md:text-right">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</p>
              <p className="font-medium text-gray-900 flex items-center md:justify-end gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Tracking Bar */}
          {!isFailed && (
            <div className="relative pt-4 pb-2">
              <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-gray-200 rounded-full"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(Math.max(0, currentStepIndex) / (STATUS_STEPS.length - 1)) * 100}%` }}
              ></div>
              <div className="relative flex justify-between">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 bg-white transition-colors duration-300 relative z-10
                        ${isCompleted ? 'border-amber-500 text-amber-500' : 'border-gray-200 text-gray-300'}
                        ${isCurrent ? 'ring-4 ring-amber-500/20' : ''}
                      `}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" strokeWidth={3} /> : <div className="h-2 w-2 rounded-full bg-current" />}
                      </div>
                      <span className={`mt-3 text-xs font-bold uppercase tracking-wider absolute top-8 whitespace-nowrap
                        ${isCurrent ? 'text-amber-700' : isCompleted ? 'text-gray-900' : 'text-gray-400'}
                      `}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {isFailed && (
            <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-red-700 font-semibold text-center">
              Order Status: {order.status}
            </div>
          )}
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          {/* Left: Items */}
          <div className="p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              Order Items
            </h3>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <Package className="h-6 w-6 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="font-bold text-gray-900 truncate">{item.product.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                    <p className="text-sm font-semibold text-amber-700 mt-1">₹{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Summary & Info */}
          <div className="p-6 md:p-8 bg-gray-50/30">
            <div className="space-y-8">
              
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Payment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between font-bold text-lg text-gray-900">
                    <span>Total</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Shipping Details
                </h3>
                <div className="rounded-xl bg-white p-4 border border-gray-100 shadow-sm text-sm">
                  <p className="font-bold text-gray-900 mb-1">{order.customerName || 'Customer'}</p>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    {order.shippingAddress || 'No address provided'}
                  </p>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Phone className="h-4 w-4" />
                    <span>{order.customerPhone || 'No phone provided'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-3.5 font-bold text-white transition hover:bg-gray-800 hover:-translate-y-0.5 shadow-lg shadow-gray-900/20"
        >
          Continue Shopping
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
