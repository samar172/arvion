"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Store, Globe, Plus, Upload, Download, X } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import {
  inr,
  dateTime,
  ORDER_STATUSES,
  statusVariant,
  CHANNEL_LABEL,
  PAYMENT_LABEL,
} from "@/lib/format";
import { exportSheet, today } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shell/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OrderSheet } from "./order-sheet";
import { ShopSalesImport } from "./shop-sales-import";

type ChannelTab = "ALL" | "ONLINE" | "OFFLINE";

/** Orders whose stock has left the shelf; cancelling one puts the units back. */
const STOCK_OUT = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
const FINAL = ["CANCELLED", "FAILED"];

const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
const customerOf = (o: any) => o.customerName || o.user?.name || "Walk-in customer";
const units = (o: any) => (o.items ?? []).reduce((n: number, i: any) => n + i.quantity, 0);

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<ChannelTab>("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [cancelling, setCancelling] = useState<{ order: any; status: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await api.get(`/orders?${params}`);
      setOrders(res.data || []);
    } catch (err) {
      toast.error(apiError(err, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const writeStatus = async (order: any, status: string, reload = false) => {
    const prev = order.status;
    setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status } : o)));
    try {
      await api.put(`/orders/${order.id}/status`, { status });
      toast.success(
        FINAL.includes(status) && STOCK_OUT.includes(prev)
          ? `Order ${label(status).toLowerCase()} · stock returned`
          : `Order marked ${status.toLowerCase()}`
      );
      if (reload) load();
    } catch (err) {
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: prev } : o)));
      toast.error(apiError(err, "Could not update status"));
    }
  };

  const changeStatus = (order: any, status: string) => {
    // Ending an order is final, so ask first.
    if (FINAL.includes(status)) setCancelling({ order, status });
    else writeStatus(order, status);
  };

  const counts = useMemo(
    () => ({
      ALL: orders.length,
      ONLINE: orders.filter((o) => o.channel !== "OFFLINE").length,
      OFFLINE: orders.filter((o) => o.channel === "OFFLINE").length,
    }),
    [orders]
  );

  const filtered = orders.filter((o) => {
    if (channel === "ONLINE" && o.channel === "OFFLINE") return false;
    if (channel === "OFFLINE" && o.channel !== "OFFLINE") return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      customerOf(o).toLowerCase().includes(q) ||
      o.customerPhone?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.items?.some((i: any) => i.product?.title?.toLowerCase().includes(q))
    );
  });

  const filteredTotal = filtered
    .filter((o) => !FINAL.includes(o.status) && o.status !== "PENDING")
    .reduce((n, o) => n + Number(o.totalAmount), 0);

  const exportOrders = () =>
    exportSheet(`Orders-${today()}`, filtered, [
      { header: "Order", value: (o) => o.id.slice(0, 8).toUpperCase() },
      { header: "Date", value: (o) => dateTime(o.createdAt), width: 20 },
      { header: "Channel", value: (o) => CHANNEL_LABEL[o.channel] ?? "Online" },
      { header: "Status", value: (o) => label(o.status) },
      { header: "Customer", value: customerOf, width: 22 },
      { header: "Phone", value: (o) => o.customerPhone || o.user?.phone || "" },
      { header: "Payment", value: (o) => PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod ?? "" },
      {
        header: "Items",
        value: (o) =>
          (o.items ?? []).map((i: any) => `${i.product?.title ?? "Item"} × ${i.quantity}`).join("; "),
        width: 50,
      },
      { header: "Subtotal", value: (o) => Number(o.subtotalAmount ?? o.totalAmount) },
      { header: "Discount", value: (o) => Number(o.discountAmount ?? 0) },
      { header: "Total", value: (o) => Number(o.totalAmount) },
    ], "Orders");

  const hasFilters = statusFilter !== "ALL" || from || to || search;

  return (
    <div>
      <PageHeader title="Orders" description="Online and shop orders in one place. Stock is shared between both.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Import<span className="hidden sm:inline">&nbsp;shop sales</span>
          </Button>
          <Button variant="outline" onClick={exportOrders} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
          <Button asChild>
            <Link href="/pos">
              <Plus className="h-4 w-4 mr-1.5" /> New shop sale
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Channel tabs */}
      <div className="flex gap-1 border-b mb-4 overflow-x-auto">
        {(
          [
            ["ALL", "All orders", null],
            ["ONLINE", "Online", Globe],
            ["OFFLINE", "Shop", Store],
          ] as const
        ).map(([key, text, Icon]) => (
          <button
            key={key}
            onClick={() => setChannel(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap",
              channel === key
                ? "border-accent text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {text}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <div className="relative lg:max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Customer, phone, product or order id…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {label(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="w-[9.5rem]"
              aria-label="From date"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="w-[9.5rem]"
              aria-label="To date"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter("ALL");
                setFrom("");
                setTo("");
                setSearch("");
              }}
            >
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
        {!loading && filtered.length > 0 && (
          <div className="lg:ml-auto self-center text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} orders · <span className="text-foreground font-medium">{inr(filteredTotal)}</span> sold
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden md:table-cell">Channel</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="hidden sm:table-cell">Placed</TableHead>
              <TableHead className="w-44">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {hasFilters || channel !== "ALL" ? "No orders match these filters." : "No orders yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => {
                const shop = o.channel === "OFFLINE";
                return (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setSelected(o)}>
                    <TableCell className="font-mono text-xs">
                      #{o.id.slice(0, 8).toUpperCase()}
                      <div className="mt-1 text-muted-foreground font-sans">
                        {units(o)} item{units(o) === 1 ? "" : "s"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{customerOf(o)}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.customerPhone || o.user?.phone || o.user?.email || ""}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="gap-1 font-normal">
                        {shop ? <Store className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                        {CHANNEL_LABEL[o.channel] ?? "Online"}
                      </Badge>
                      {o.paymentMethod && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{inr(o.totalAmount)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                      {dateTime(o.createdAt)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {FINAL.includes(o.status) ? (
                        <Badge variant={statusVariant(o.status)}>{o.status.toLowerCase()}</Badge>
                      ) : (
                        <Select value={o.status} onValueChange={(v) => changeStatus(o, v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {label(s)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <OrderSheet orderId={selected?.id ?? null} onOpenChange={(v) => !v && setSelected(null)} />

      <ShopSalesImport open={importOpen} onOpenChange={setImportOpen} onDone={load} />

      <AlertDialog open={!!cancelling} onOpenChange={(v) => !v && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark order #{cancelling?.order.id.slice(0, 8).toUpperCase()}{" "}
              {cancelling?.status.toLowerCase()}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelling && STOCK_OUT.includes(cancelling.order.status)
                ? `The ${units(cancelling.order)} unit${
                    units(cancelling.order) === 1 ? "" : "s"
                  } in this order will be returned to stock.`
                : "Any stock held for this order will be released."}{" "}
              This can&rsquo;t be undone; the order can&rsquo;t be reopened afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (cancelling) writeStatus(cancelling.order, cancelling.status, true);
                setCancelling(null);
              }}
            >
              Mark {cancelling?.status.toLowerCase()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
