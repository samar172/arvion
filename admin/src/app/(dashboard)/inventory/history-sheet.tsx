"use client";

import { useEffect, useState } from "react";
import { History, Loader2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { dateTime, inr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Change, MovementBadge, orderRef } from "./ledger";
import { STATUS_LABEL, type InventoryRow, type Movement } from "./types";

const PAGE_SIZE = 30;

/** One product's stock figures and its full movement history. */
export function HistorySheet({
  row,
  refreshKey,
  onOpenChange,
  onAdjust,
}: {
  row: InventoryRow | null;
  refreshKey: number;
  onOpenChange: (open: boolean) => void;
  onAdjust: (row: InventoryRow) => void;
}) {
  const [items, setItems] = useState<Movement[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const productId = row?.productId;

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoading(true);
    api
      .get(`/inventory/movements?productId=${productId}&page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => {
        if (cancelled) return;
        setItems((prev) => (page === 1 ? res.data.data : [...prev, ...res.data.data]));
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => !cancelled && toast.error(apiError(err, "Could not load history")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId, page, refreshKey]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [productId, refreshKey]);

  return (
    <Sheet open={!!row} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {row && (
          <>
            <SheetHeader>
              <SheetTitle className="font-display text-2xl leading-tight pr-6">{row.title}</SheetTitle>
              <SheetDescription className="font-mono">{row.sku}</SheetDescription>
            </SheetHeader>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "On hand", value: row.stock },
                { label: "Reserved", value: row.reserved },
                { label: "Available", value: row.available },
              ].map((s) => (
                <div key={s.label} className="rounded-md border bg-muted/40 px-2 py-3">
                  <div className="text-xl font-semibold tabular-nums">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>
                {STATUS_LABEL[row.status]} · alert at {row.lowStockThreshold} · sold {row.sold30.total} in 30 days
                {row.sold30.total > 0 && ` (${row.sold30.online} online, ${row.sold30.offline} shop)`}
              </span>
              <span>Value {inr(row.stock * row.price)}</span>
            </div>
            <Button className="mt-4 w-full" variant="outline" onClick={() => onAdjust(row)}>
              <SlidersHorizontal className="h-4 w-4 mr-1.5" /> Adjust stock
            </Button>

            <h4 className="mt-6 mb-2 text-xs uppercase tracking-wide text-muted-foreground">History</h4>
            {loading && items.length === 0 ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                <History className="mx-auto mb-2 h-5 w-5 opacity-60" />
                No movements recorded yet.
              </div>
            ) : (
              <ol className="flex flex-col divide-y rounded-md border">
                {items.map((m) => (
                  <li key={m.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <MovementBadge type={m.type} />
                        {m.orderId && <span className="font-mono text-xs">{orderRef(m.orderId)}</span>}
                      </div>
                      {m.note && <p className="mt-1 text-sm text-muted-foreground">{m.note}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dateTime(m.createdAt)}
                        {m.createdBy && ` · ${m.createdBy}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Change value={m.quantity} />
                      <div className="text-xs text-muted-foreground tabular-nums">→ {m.balanceAfter}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {page < totalPages && (
              <Button variant="ghost" className="mt-3 w-full" disabled={loading} onClick={() => setPage((p) => p + 1)}>
                {loading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Show older
              </Button>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
