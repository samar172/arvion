"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { IndianRupee, ShoppingCart, TrendingUp, Trophy } from "lucide-react";

interface Overview {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  totalProducts: number;
  lowStockCount: number;
  averageOrderValue: number;
}
interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}
interface TopProduct {
  productId: string;
  title: string;
  unitsSold: number;
  revenue: number;
}
interface StatusCount {
  status: string;
  count: number;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const compact = (n: number) =>
  n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n}`;
const shortDate = (d: string) => d.slice(5).replace("-", "/");

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#10b981",
  PROCESSING: "#3b82f6",
  SHIPPED: "#6366f1",
  DELIVERED: "#22c55e",
  CANCELLED: "#9ca3af",
  FAILED: "#ef4444",
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [statuses, setStatuses] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/overview"),
      api.get("/analytics/revenue?days=30"),
      api.get("/analytics/top-products?limit=6"),
      api.get("/analytics/orders-by-status"),
    ])
      .then(([ov, rev, tp, st]) => {
        setOverview(ov.data);
        setRevenue(rev.data);
        setTopProducts(tp.data);
        setStatuses(st.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Total Revenue", value: overview ? inr(overview.totalRevenue) : "—", icon: IndianRupee },
    { label: "Paid Orders", value: overview ? String(overview.totalOrders) : "—", icon: ShoppingCart },
    { label: "Avg. Order Value", value: overview ? inr(overview.averageOrderValue) : "—", icon: TrendingUp },
    { label: "Active Orders", value: overview ? String(overview.activeOrders) : "—", icon: Trophy },
  ];

  if (loading) {
    return <p className="animate-pulse text-sm font-medium text-gray-500">Loading analytics…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500">Revenue, best sellers and order flow (last 30 days)</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          Failed to load analytics. Ensure the backend is running and you are an admin.
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-500">{k.label}</p>
                  <p className="text-xl font-bold text-gray-900">{k.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue over time */}
      <Panel title="Revenue — last 30 days">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenue} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={compact}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              formatter={(v: any) => [inr(Number(v)), "Revenue"]}
              labelFormatter={(l) => `Date: ${l}`}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#059669"
              strokeWidth={2.5}
              fill="url(#revFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top products */}
        <Panel title="Best-selling attars">
          {topProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No sales data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  tickFormatter={(t: string) => (t.length > 18 ? t.slice(0, 17) + "…" : t)}
                />
                <Tooltip
                  formatter={(v: any) => [`${v} units`, "Sold"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="unitsSold" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Orders by status */}
        <Panel title="Orders by status">
          {statuses.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statuses} margin={{ top: 0, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={56}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  formatter={(v: any) => [`${v} orders`, "Count"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={34}>
                  {statuses.map((s) => (
                    <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? "#9ca3af"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </div>
  );
}
