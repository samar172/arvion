"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, LogOut, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login/customer?redirect=/profile");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        try {
          const res = await api.get("/orders/my-orders");
          setOrders(res.data);
        } catch (err) {
          console.error("Failed to fetch orders", err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 flex-1 w-full">
      <h1 className="text-3xl font-display font-extrabold text-gray-900 mb-8">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Details Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="h-16 w-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-gray-600">
                <Mail className="h-5 w-5 flex-shrink-0 text-gray-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Email</p>
                  <p className="text-sm font-medium truncate">{user.email || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-gray-600">
                <Phone className="h-5 w-5 flex-shrink-0 text-gray-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Phone</p>
                  <p className="text-sm font-medium truncate">{user.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin className="h-5 w-5 flex-shrink-0 text-gray-400 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Shipping Address</p>
                  <p className="text-sm font-medium leading-relaxed">{user.address || "No address saved"}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-600 font-bold hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 h-full">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="h-6 w-6 text-amber-500" />
              Order History
            </h2>

            {loadingOrders ? (
              <div className="py-12 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 px-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No orders yet</h3>
                <p className="text-gray-500 text-sm mb-4">When you place orders, they will appear here.</p>
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700">
                  Start shopping <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <Link 
                    key={order.id} 
                    href={`/order-success?order=${order.id}`}
                    className="block rounded-2xl border border-gray-100 p-4 hover:border-amber-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${order.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 
                              order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                              order.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'}
                          `}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item(s)
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
