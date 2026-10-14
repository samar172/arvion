"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  Upload,
  ScanLine,
  EyeOff,
  Loader2,
  ReceiptText,
} from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { inr, PAYMENT_METHODS, PAYMENT_LABEL, type PaymentMethod } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShopSalesImport } from "../orders/shop-sales-import";

interface Item {
  productId: string;
  title: string;
  sku: string;
  imageUrl?: string | null;
  price: number;
  available: number;
  isActive: boolean;
  category?: { id: string; name: string } | null;
}

interface Line {
  item: Item;
  quantity: number;
  /** Kept as text so the field can be cleared while typing. */
  unitPrice: string;
}

interface Done {
  id: string;
  total: number;
  units: number;
  payment: PaymentMethod;
}

const priceOf = (l: Line) => {
  const n = Number(l.unitPrice);
  return Number.isFinite(n) && l.unitPrice.trim() !== "" ? n : l.item.price;
};

export default function PosPage() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [soldAt, setSoldAt] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [billOpen, setBillOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const loadStock = useCallback(async () => {
    try {
      const res = await api.get("/inventory?all=true&sort=title&order=asc");
      setItems(res.data.data || []);
    } catch (err) {
      toast.error(apiError(err, "Could not load products"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((i) => i.category && map.set(i.category.id, i.category.name));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const term = search.trim().toLowerCase();
  const visible = items.filter(
    (i) =>
      (category === "all" || i.category?.id === category) &&
      (!term || i.title.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term))
  );

  const inBill = (id: string) => lines.find((l) => l.item.productId === id)?.quantity ?? 0;

  const add = (item: Item) => {
    if (item.available <= 0) return;
    setDone(null);
    setLines((ls) => {
      const existing = ls.find((l) => l.item.productId === item.productId);
      if (existing) {
        if (existing.quantity >= item.available) {
          toast.error(`Only ${item.available} of ${item.title} in stock`);
          return ls;
        }
        return ls.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...ls, { item, quantity: 1, unitPrice: String(item.price) }];
    });
  };

  const setQty = (id: string, q: number) =>
    setLines((ls) =>
      ls
        .map((l) =>
          l.item.productId === id ? { ...l, quantity: Math.min(Math.max(q, 0), l.item.available) } : l
        )
        .filter((l) => l.quantity > 0)
    );

  // Enter adds an exact SKU match (barcode scanners type the code then Enter), or the only result.
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const exact = items.find((i) => i.sku.toLowerCase() === term);
    const target = exact ?? (visible.length === 1 ? visible[0] : undefined);
    if (!target) {
      if (term) toast.error(`No single product matches “${search.trim()}”`);
      return;
    }
    if (target.available <= 0) {
      toast.error(`${target.title} is out of stock`);
      return;
    }
    add(target);
    setSearch("");
  };

  const subtotal = lines.reduce((n, l) => n + priceOf(l) * l.quantity, 0);
  const discountValue = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const total = Math.round((subtotal - discountValue) * 100) / 100;
  const unitCount = lines.reduce((n, l) => n + l.quantity, 0);
  const priceError = lines.some((l) => l.unitPrice.trim() !== "" && !(Number(l.unitPrice) >= 0));

  const reset = () => {
    setLines([]);
    setDiscount("");
    setPayment("CASH");
    setCustomerName("");
    setCustomerPhone("");
    setSoldAt("");
    setNote("");
    setDone(null);
    setBillOpen(false);
    searchRef.current?.focus();
  };

  const complete = useCallback(async () => {
    if (!lines.length || submitting || priceError) return;
    setSubmitting(true);
    try {
      const res = await api.post("/orders/offline", {
        items: lines.map((l) => ({
          productId: l.item.productId,
          quantity: l.quantity,
          ...(priceOf(l) !== l.item.price ? { unitPrice: priceOf(l) } : {}),
        })),
        paymentMethod: payment,
        discountAmount: discountValue || undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        note: note.trim() || undefined,
        soldAt: soldAt ? new Date(soldAt).toISOString() : undefined,
      });
      setDone({ id: res.data.id, total: Number(res.data.totalAmount), units: unitCount, payment });
      setLines([]);
      setDiscount("");
      setCustomerName("");
      setCustomerPhone("");
      setSoldAt("");
      setNote("");
      toast.success("Sale recorded");
      loadStock();
    } catch (err) {
      toast.error(apiError(err, "Could not record the sale"));
      loadStock(); // stock may have changed under us
    } finally {
      setSubmitting(false);
    }
  }, [lines, submitting, priceError, payment, discountValue, customerName, customerPhone, note, soldAt, unitCount, loadStock]);

  // "/" jumps to search; Ctrl/⌘+Enter completes the sale.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, select");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        complete();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [complete]);

  const bill = (
    <BillPanel
      lines={lines}
      setQty={setQty}
      setPrice={(id, v) =>
        setLines((ls) => ls.map((l) => (l.item.productId === id ? { ...l, unitPrice: v } : l)))
      }
      discount={discount}
      setDiscount={setDiscount}
      payment={payment}
      setPayment={setPayment}
      customerName={customerName}
      setCustomerName={setCustomerName}
      customerPhone={customerPhone}
      setCustomerPhone={setCustomerPhone}
      soldAt={soldAt}
      setSoldAt={setSoldAt}
      note={note}
      setNote={setNote}
      subtotal={subtotal}
      discountValue={discountValue}
      total={total}
      submitting={submitting}
      disabled={!lines.length || priceError}
      onComplete={complete}
      done={done}
      onNewSale={reset}
    />
  );

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader
        title="Shop sale"
        description="Sell from the counter. Stock comes from the same pool as the online store."
      >
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-1.5" /> Import shop sales
        </Button>
        <Button variant="ghost" asChild className="hidden sm:inline-flex">
          <Link href="/orders">View orders</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        {/* Product picker */}
        <section className="min-w-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Search name or scan SKU, then Enter"
              className="pl-9 pr-10 h-11 text-base"
              aria-label="Search products"
            />
            <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
            {[["all", "All"] as const, ...categories].map(([id, name]) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  category === id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:border-accent"
                )}
              >
                {name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-lg border bg-card py-16 text-center text-sm text-muted-foreground">
              No products match.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {visible.map((i) => {
                const qty = inBill(i.productId);
                const out = i.available <= 0;
                const maxed = !out && qty >= i.available;
                return (
                  <button
                    key={i.productId}
                    onClick={() => add(i)}
                    disabled={out || maxed}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-lg border bg-card text-left transition",
                      "hover:border-accent hover:shadow-sm active:scale-[0.98] disabled:active:scale-100",
                      qty > 0 && "border-accent ring-1 ring-accent",
                      (out || maxed) && "opacity-55 cursor-not-allowed"
                    )}
                  >
                    <div className="relative aspect-[4/3] bg-muted">
                      {i.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={i.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                        />
                      )}
                      {qty > 0 && (
                        <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
                          {qty}
                        </span>
                      )}
                      {!i.isActive && (
                        <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                          <EyeOff className="h-3 w-3" /> Hidden online
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-2.5">
                      <span className="line-clamp-2 text-sm font-medium leading-snug">{i.title}</span>
                      <span className="text-[11px] text-muted-foreground">{i.sku}</span>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="font-semibold tabular-nums">{inr(i.price)}</span>
                        <span
                          className={cn(
                            "text-xs tabular-nums",
                            out ? "text-destructive font-medium" : i.available <= 5 ? "text-accent font-medium" : "text-muted-foreground"
                          )}
                        >
                          {out ? "Out of stock" : `${i.available} left`}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Bill: side panel on desktop */}
        <aside className="hidden lg:block lg:sticky lg:top-6">{bill}</aside>
      </div>

      {/* Bill: bottom bar + sheet on smaller screens */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setBillOpen(true)}
          className="flex w-full items-center justify-between gap-3 rounded-md bg-primary px-4 py-3 text-primary-foreground"
        >
          <span className="flex items-center gap-2 text-sm">
            <ShoppingBag className="h-4 w-4" />
            {done && !lines.length ? "Sale recorded" : `${unitCount} item${unitCount === 1 ? "" : "s"}`}
          </span>
          <span className="font-semibold tabular-nums">
            {done && !lines.length ? inr(done.total) : inr(total)} · View bill
          </span>
        </button>
      </div>
      <Sheet open={billOpen} onOpenChange={setBillOpen}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-xl p-4">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl text-left">Bill</SheetTitle>
          </SheetHeader>
          <div className="mt-3">{bill}</div>
        </SheetContent>
      </Sheet>

      <ShopSalesImport open={importOpen} onOpenChange={setImportOpen} onDone={loadStock} />
    </div>
  );
}

function BillPanel(props: {
  lines: Line[];
  setQty: (id: string, q: number) => void;
  setPrice: (id: string, v: string) => void;
  discount: string;
  setDiscount: (v: string) => void;
  payment: PaymentMethod;
  setPayment: (v: PaymentMethod) => void;
  customerName: string;
  setCustomerName: (v: string) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  soldAt: string;
  setSoldAt: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  subtotal: number;
  discountValue: number;
  total: number;
  submitting: boolean;
  disabled: boolean;
  onComplete: () => void;
  done: Done | null;
  onNewSale: () => void;
}) {
  const { lines, done } = props;

  if (done && !lines.length) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h3 className="mt-3 font-display text-2xl">Sale recorded</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Order <span className="font-mono">#{done.id.slice(0, 8).toUpperCase()}</span> · {done.units} item
          {done.units === 1 ? "" : "s"} · {PAYMENT_LABEL[done.payment]}
        </p>
        <p className="mt-4 font-display text-4xl tabular-nums">{inr(done.total)}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={props.onNewSale} size="lg" autoFocus>
            <Plus className="h-4 w-4 mr-1.5" /> New sale
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/orders">View in orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const maxDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <div className="flex flex-col rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-display text-xl flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-accent" /> Current bill
        </h3>
        {lines.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {lines.reduce((n, l) => n + l.quantity, 0)} items
          </span>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Tap a product or scan a SKU to start a bill.
        </div>
      ) : (
        <ul className="divide-y max-h-[38vh] overflow-y-auto">
          {lines.map((l) => (
            <li key={l.item.productId} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{l.item.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {l.item.sku} · {l.item.available} in stock
                  </p>
                </div>
                <button
                  onClick={() => props.setQty(l.item.productId, 0)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${l.item.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center rounded-md border">
                  <button
                    className="h-8 w-8 flex items-center justify-center hover:bg-muted"
                    onClick={() => props.setQty(l.item.productId, l.quantity - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    value={l.quantity}
                    onChange={(e) => props.setQty(l.item.productId, Math.floor(Number(e.target.value) || 0))}
                    inputMode="numeric"
                    className="h-8 w-10 border-x bg-transparent text-center text-sm tabular-nums focus:outline-none"
                    aria-label="Quantity"
                  />
                  <button
                    className="h-8 w-8 flex items-center justify-center hover:bg-muted disabled:opacity-40"
                    onClick={() => props.setQty(l.item.productId, l.quantity + 1)}
                    disabled={l.quantity >= l.item.available}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">×</span>
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                  <Input
                    value={l.unitPrice}
                    onChange={(e) => props.setPrice(l.item.productId, e.target.value)}
                    inputMode="decimal"
                    className={cn(
                      "h-8 pl-5 text-sm tabular-nums",
                      Number(l.unitPrice) !== l.item.price && "border-accent"
                    )}
                    aria-label="Unit price"
                  />
                </div>
                <span className="ml-auto text-sm font-medium tabular-nums">
                  {inr(priceOf(l) * l.quantity)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-4 border-t px-4 py-4">
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Payment</Label>
          <div className="mt-1.5 grid grid-cols-4 gap-1 rounded-md bg-muted p-1" role="radiogroup">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={props.payment === m}
                onClick={() => props.setPayment(m)}
                className={cn(
                  "rounded px-2 py-1.5 text-sm transition-colors",
                  props.payment === m ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {PAYMENT_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="pos-name" className="text-xs text-muted-foreground">Customer</Label>
            <Input
              id="pos-name"
              value={props.customerName}
              onChange={(e) => props.setCustomerName(e.target.value)}
              placeholder="Walk-in"
              className="h-9 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pos-phone" className="text-xs text-muted-foreground">Phone</Label>
            <Input
              id="pos-phone"
              value={props.customerPhone}
              onChange={(e) => props.setCustomerPhone(e.target.value)}
              inputMode="tel"
              placeholder="Optional"
              className="h-9 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pos-discount" className="text-xs text-muted-foreground">Discount (₹)</Label>
            <Input
              id="pos-discount"
              value={props.discount}
              onChange={(e) => props.setDiscount(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              className="h-9 mt-1"
            />
          </div>
          <div>
            <Label htmlFor="pos-date" className="text-xs text-muted-foreground">Sale date</Label>
            <Input
              id="pos-date"
              type="datetime-local"
              value={props.soldAt}
              max={maxDate}
              onChange={(e) => props.setSoldAt(e.target.value)}
              className="h-9 mt-1 text-xs"
              title="Leave empty for now; set to record an earlier sale"
            />
          </div>
        </div>
        <Textarea
          value={props.note}
          onChange={(e) => props.setNote(e.target.value)}
          placeholder="Note (optional), e.g. gift wrap, bill number"
          rows={2}
          className="text-sm"
        />

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{inr(props.subtotal)}</span>
          </div>
          {props.discountValue > 0 && (
            <div className="flex justify-between text-primary">
              <span>Discount</span>
              <span className="tabular-nums">−{inr(props.discountValue)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-display text-2xl">
            <span>Total</span>
            <span className="tabular-nums">{inr(props.total)}</span>
          </div>
        </div>

        <Button size="lg" onClick={props.onComplete} disabled={props.disabled || props.submitting}>
          {props.submitting ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
          )}
          Complete sale · {inr(props.total)}
        </Button>
        <p className="-mt-2 text-center text-[11px] text-muted-foreground">
          <kbd className="rounded border px-1">/</kbd> search ·{" "}
          <kbd className="rounded border px-1">Ctrl</kbd>+<kbd className="rounded border px-1">Enter</kbd> complete
        </p>
      </div>
    </div>
  );
}
