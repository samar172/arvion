"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  IndianRupee,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

interface Overview {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  totalProducts: number;
  lowStockCount: number;
  averageOrderValue: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  email: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
  FAILED: "bg-red-100 text-red-700",
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/overview"),
      api.get("/analytics/recent-orders?limit=8"),
    ])
      .then(([ov, ro]) => {
        setOverview(ov.data);
        setRecent(ro.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Total Revenue",
      value: overview ? inr(overview.totalRevenue) : "—",
      sub: overview ? `${overview.totalOrders} paid orders` : "",
      icon: IndianRupee,
      tone: "text-emerald-600 bg-emerald-50 ring-emerald-100",
    },
    {
      label: "Active Orders",
      value: overview ? String(overview.activeOrders) : "—",
      sub: "In fulfillment",
      icon: ShoppingCart,
      tone: "text-blue-600 bg-blue-50 ring-blue-100",
    },
    {
      label: "Avg. Order Value",
      value: overview ? inr(overview.averageOrderValue) : "—",
      sub: "Per paid order",
      icon: TrendingUp,
      tone: "text-amber-600 bg-amber-50 ring-amber-100",
    },
    {
      label: "Low Stock",
      value: overview ? `${overview.lowStockCount} items` : "—",
      sub: `${overview?.totalProducts ?? 0} products total`,
      icon: AlertTriangle,
      tone:
        overview && overview.lowStockCount > 0
          ? "text-red-600 bg-red-50 ring-red-100"
          : "text-gray-500 bg-gray-50 ring-gray-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Store performance at a glance</p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800"
        >
          View Analytics
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          Failed to load dashboard data. Make sure the backend is running and you are
          signed in as an admin.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">{card.label}</h3>
                  <p
                    className={`mt-2 text-2xl font-bold text-gray-900 ${
                      loading ? "animate-pulse text-gray-300" : ""
                    }`}
                  >
                    {loading ? "···" : card.value}
                  </p>
                  {card.sub && !loading && (
                    <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
                  )}
                </div>
                <span className={`grid h-11 w-11 place-items-center rounded-xl ring-1 ${card.tone}`}>
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <Link href="/admin/orders" className="text-sm font-bold text-emerald-700 hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-400">Loading recent orders…</div>
        ) : recent.length === 0 ? (
          <div className="p-10 text-center">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gray-50 text-gray-300">
              <Package className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <p className="text-sm text-gray-500">No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {o.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-semibold text-gray-800">{o.customer}</p>
                      <p className="text-xs text-gray-400">{o.email}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{o.itemCount}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${
                          STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">
                      {inr(o.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
