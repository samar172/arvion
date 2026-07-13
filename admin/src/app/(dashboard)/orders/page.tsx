"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { inr, dateTime, ORDER_STATUSES, statusVariant } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderSheet } from "./order-sheet";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      setOrders(res.data || []);
    } catch (err) {
      toast.error(apiError(err, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (order: any, status: string) => {
    const prev = order.status;
    setOrders((os) =>
      os.map((o) => (o.id === order.id ? { ...o, status } : o))
    );
    try {
      await api.put(`/orders/${order.id}/status`, { status });
      toast.success(`Order marked ${status.toLowerCase()}`);
    } catch (err) {
      setOrders((os) =>
        os.map((o) => (o.id === order.id ? { ...o, status: prev } : o))
      );
      toast.error(apiError(err, "Could not update status"));
    }
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      o.customerName?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader title="Orders" description="Review orders and update fulfilment status." />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative sm:max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or order id…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead className="w-44">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(o)}
                >
                  <TableCell className="font-mono text-xs">
                    #{o.id.slice(0, 8).toUpperCase()}
                    <div className="mt-1">
                      <Badge variant={statusVariant(o.status)} className="font-sans">
                        {o.status.toLowerCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {o.customerName || o.user?.name || "Guest"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.user?.email || o.user?.phone || ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {inr(o.totalAmount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {dateTime(o.createdAt)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={o.status}
                      onValueChange={(v) => changeStatus(o, v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OrderSheet
        orderId={selected?.id ?? null}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}
