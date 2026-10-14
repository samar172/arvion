"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Search, ChevronLeft, ChevronRight, History } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { dateTime, MOVEMENT_LABEL, MOVEMENT_TYPES, signed } from "@/lib/format";
import { exportSheet, today } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import type { Movement } from "./types";

const PAGE_SIZE = 25;

/** Sales and losses read as "out", everything else as "in" — colour follows the sign. */
export function MovementBadge({ type }: { type: string }) {
  const tone =
    type === "SALE_ONLINE" || type === "SALE_OFFLINE"
      ? "secondary"
      : type === "DAMAGE"
        ? "destructive"
        : "outline";
  return (
    <Badge variant={tone} className="whitespace-nowrap font-normal">
      {MOVEMENT_LABEL[type] ?? type}
    </Badge>
  );
}

export function Change({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        value > 0 ? "text-emerald-700 dark:text-emerald-400" : value < 0 ? "text-destructive" : ""
      )}
    >
      {signed(value)}
    </span>
  );
}

export const orderRef = (id: string | null) => (id ? `#${id.slice(0, 8).toUpperCase()}` : "");

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Full stock ledger across all products, with filters and export. */
export function LedgerTab({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [type, setType] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim());

  const params = useCallback(
    (extra: Record<string, string | number | boolean>) => {
      const p = new URLSearchParams();
      if (type !== "ALL") p.set("type", type);
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (search) p.set("search", search);
      for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
      return p.toString();
    },
    [type, from, to, search]
  );

  useEffect(() => setPage(1), [type, from, to, search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/inventory/movements?${params({ page, limit: PAGE_SIZE })}`)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.data);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => !cancelled && toast.error(apiError(err, "Failed to load stock history")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params, page, refreshKey]);

  const exportAll = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/inventory/movements?${params({ all: true })}`);
      const data: Movement[] = res.data.data;
      await exportSheet(
        `Stock-history-${today()}`,
        data,
        [
          { header: "Date", value: (m) => dateTime(m.createdAt), width: 20 },
          { header: "SKU", value: (m) => m.product.sku, width: 14 },
          { header: "Product", value: (m) => m.product.title, width: 36 },
          { header: "Type", value: (m) => MOVEMENT_LABEL[m.type] ?? m.type, width: 14 },
          { header: "Change", value: (m) => m.quantity },
          { header: "Balance after", value: (m) => m.balanceAfter },
          { header: "Order", value: (m) => orderRef(m.orderId) },
          { header: "Note", value: (m) => m.note ?? "", width: 36 },
          { header: "By", value: (m) => m.createdBy ?? "", width: 16 },
        ],
        "Stock history"
      );
      if (data.length >= 5000) toast.info("Exported the latest 5,000 entries. Narrow the dates for older ones.");
    } catch (err) {
      toast.error(apiError(err, "Export failed"));
    } finally {
      setExporting(false);
    }
  };

  const filtered = type !== "ALL" || from || to || search;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Product or SKU…"
            className="pl-9"
            aria-label="Search stock history"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="lg:w-44" aria-label="Movement type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All movements</SelectItem>
            {MOVEMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {MOVEMENT_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            From
            <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="lg:w-40" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            To
            <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="lg:w-40" />
          </label>
        </div>
        {filtered && (
          <Button
            variant="ghost"
            onClick={() => {
              setType("ALL");
              setFrom("");
              setTo("");
              setSearchInput("");
            }}
          >
            Clear
          </Button>
        )}
        <span className="flex-1" />
        <Button variant="outline" onClick={exportAll} disabled={exporting || total === 0}>
          <Download className="h-4 w-4 mr-1.5" />
          {exporting ? "Exporting…" : "Export"}
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">When</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center text-muted-foreground">
                  <History className="mx-auto mb-2 h-6 w-6 opacity-60" />
                  {filtered ? "No stock movements match these filters." : "No stock movements yet."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((m) => (
                <TableRow key={m.id} className={cn(loading && "opacity-60")}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{dateTime(m.createdAt)}</TableCell>
                  <TableCell>
                    <div className="font-medium leading-tight">{m.product.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{m.product.sku}</div>
                  </TableCell>
                  <TableCell>
                    <MovementBadge type={m.type} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Change value={m.quantity} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{m.balanceAfter}</TableCell>
                  <TableCell className="text-sm max-w-[18rem]">
                    {m.orderId && <span className="font-mono text-xs mr-2">{orderRef(m.orderId)}</span>}
                    <span className="text-muted-foreground">{m.note}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {m.createdBy ?? (m.type === "SALE_ONLINE" ? "Customer" : "—")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="movement" onPage={setPage} />
    </div>
  );
}

export function Pager({
  page,
  totalPages,
  total,
  noun,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  noun: string;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        {total.toLocaleString("en-IN")} {noun}
        {total === 1 ? "" : "s"}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
