"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, User, MapPin, Phone, Calendar, Receipt, CreditCard } from "lucide-react";
import api from "@/lib/api";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Failed to load order", err);
        alert("Order not found or you don't have permission");
        router.push("/admin/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const updateOrderStatus = async (newStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-emerald border-t-transparent"></div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
              <Calendar className="h-4 w-4" />
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-sm font-bold text-gray-600 pl-2">Status:</span>
          <select 
            value={order.status}
            onChange={(e) => updateOrderStatus(e.target.value)}
            className={`text-sm font-bold rounded-md border-0 py-1.5 pl-3 pr-8 cursor-pointer focus:ring-2 focus:ring-brand-emerald
              ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                order.status === 'PROCESSING' ? 'bg-amber-100 text-amber-800' : 
                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                'bg-blue-100 text-blue-800'
              }
            `}
          >
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Items & Summary */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                Products Ordered ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item: any) => (
                <div key={item.id} className="p-6 flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <Package className="h-8 w-8 opacity-50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">{item.product.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Product ID: {item.productId.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">{item.quantity} x ₹{item.price}</p>
                    <p className="text-base font-bold text-gray-900">₹{(item.quantity * parseFloat(item.price)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Payment Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div className="text-gray-500">Razorpay Order ID</div>
                <div className="font-mono font-medium text-gray-900">{order.razorpayOrderId || "N/A"}</div>
                
                <div className="text-gray-500">Total Amount</div>
                <div className="font-bold text-lg text-brand-emerald">₹{order.totalAmount}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Customer Info */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                Customer Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Name</p>
                <p className="font-medium text-gray-900">{order.customerName || order.user?.name || "Customer"}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-900">{order.user?.email || "Not Provided"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="font-medium text-gray-900">{order.customerPhone || order.user?.phone || "Not Provided"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                Shipping Address
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed">
                {order.shippingAddress || "No shipping address provided."}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
