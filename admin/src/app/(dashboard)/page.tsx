"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import api from "@/lib/api";
import { inr, dateShort } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { statusVariant } from "@/lib/format";

interface Overview {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  totalProducts: number;
  lowStockCount: number;
  averageOrderValue: number;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/overview"),
      api.get("/analytics/revenue?days=30"),
      api.get("/analytics/recent-orders?limit=6"),
      api.get("/analytics/top-products?limit=5"),
    ])
      .then(([o, r, rec, t]) => {
        setOverview(o.data);
        setRevenue(r.data);
        setRecent(rec.data);
        setTop(t.data);
      })
      .catch((err) => console.error("Failed to load dashboard", err))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Revenue",
      value: overview ? inr(overview.totalRevenue) : "—",
      icon: IndianRupee,
    },
    {
      label: "Paid Orders",
      value: overview?.totalOrders ?? "—",
      icon: ShoppingCart,
    },
    {
      label: "Avg Order Value",
      value: overview ? inr(overview.averageOrderValue) : "—",
      icon: TrendingUp,
    },
    {
      label: "Products",
      value: overview?.totalProducts ?? "—",
      icon: Package,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {c.label}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-2" />
                ) : (
                  <div className="font-display text-3xl mt-1.5">{c.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {overview && overview.lowStockCount > 0 && (
        <Link href="/inventory">
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">
                {overview.lowStockCount} product
                {overview.lowStockCount === 1 ? "" : "s"} low on stock — review
                inventory
              </span>
            </CardContent>
          </Card>
        </Link>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              Revenue — last 30 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d3b2c" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#0d3b2c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3dcc9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d.slice(5)}
                    fontSize={11}
                    stroke="#9aa89d"
                    tickLine={false}
                  />
                  <YAxis
                    fontSize={11}
                    stroke="#9aa89d"
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                    width={40}
                  />
                  <Tooltip
                    formatter={(v: any) => [inr(v as number), "Revenue"]}
                    labelFormatter={(l) => dateShort(l)}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e3dcc9" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0d3b2c"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : top.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              top.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-muted-foreground font-display text-lg w-5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.unitsSold} sold
                    </p>
                  </div>
                  <span className="text-sm font-medium">{inr(p.revenue)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-display text-2xl">Recent Orders</CardTitle>
          <Link href="/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            recent.map((o) => (
              <Link
                key={o.id}
                href="/orders"
                className="flex items-center justify-between gap-3 rounded-md border px-4 py-2.5 hover:bg-accent/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{o.customer}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.itemCount} item{o.itemCount === 1 ? "" : "s"} ·{" "}
                    {dateShort(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant(o.status)}>
                    {o.status.toLowerCase()}
                  </Badge>
                  <span className="text-sm font-medium">{inr(o.totalAmount)}</span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
