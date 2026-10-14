"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Download,
  History,
  IndianRupee,
  PackageX,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { inr } from "@/lib/format";
import { exportSheet, today } from "@/lib/excel";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shell/page-header";
import { ImportDialog } from "@/components/import/import-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AdjustDialog } from "./adjust-dialog";
import { HistorySheet } from "./history-sheet";
import { LedgerTab, Pager } from "./ledger";
import { stockImportConfig, type StockImportMode } from "./import-config";
import { STATUS_LABEL, type InventoryRow, type InventorySummary, type StockStatus } from "./types";

const PAGE_SIZE = 25;
type SortKey = "available" | "title" | "sold" | "value" | "updated";
type StatusFilter = "all" | StockStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low" },
  { value: "out", label: "Out" },
];

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function StatusBadge({ row }: { row: InventoryRow }) {
  return (
    <Badge
      variant={row.status === "out" ? "destructive" : "outline"}
      className={cn(
        "tabular-nums min-w-[2.5rem] justify-center",
        row.status === "low" && "border-amber-500/60 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        row.status === "in" && "border-emerald-600/40 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300"
      )}
      title={STATUS_LABEL[row.status]}
    >
      {row.available}
    </Badge>
  );
}

export default function InventoryPage() {
  const [tab, setTab] = useState("levels");
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [status, setStatus] = useState<StatusFilter>("all");
  // The dashboard links here with ?status=low|out.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s === "low" || s === "out" || s === "in") setStatus(s);
  }, []);
  const [categoryId, setCategoryId] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim());
  const [sort, setSort] = useState<SortKey>("available");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);
  const [viewing, setViewing] = useState<InventoryRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<StockImportMode>("set");
  const [exporting, setExporting] = useState(false);

  const query = useCallback(
    (extra: Record<string, string | number | boolean>) => {
      const p = new URLSearchParams({ sort, order });
      if (status !== "all") p.set("status", status);
      if (categoryId !== "ALL") p.set("categoryId", categoryId);
      if (search) p.set("search", search);
      for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
      return p.toString();
    },
    [sort, order, status, categoryId, search]
  );

  useEffect(() => {
    api
      .get("/category")
      .then((res) => setCategories(res.data || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => setPage(1), [status, categoryId, search, sort, order]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/inventory?${query({ page, limit: PAGE_SIZE })}`)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.data);
        setSummary(res.data.summary);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => !cancelled && toast.error(apiError(err, "Failed to load inventory")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, page, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Keep the open history sheet's figures in step after an adjustment.
  useEffect(() => {
    setViewing((v) => (v ? rows.find((r) => r.productId === v.productId) ?? v : v));
  }, [rows]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setOrder(key === "title" ? "asc" : key === "available" ? "asc" : "desc");
    }
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/inventory?${query({ all: true })}`);
      const data: InventoryRow[] = res.data.data;
      await exportSheet(
        `Inventory-${today()}`,
        data,
        [
          { header: "SKU", value: (r) => r.sku, width: 14 },
          { header: "Product", value: (r) => r.title, width: 36 },
          { header: "Category", value: (r) => r.category?.name ?? "", width: 18 },
          { header: "On hand", value: (r) => r.stock },
          { header: "Reserved", value: (r) => r.reserved },
          { header: "Available", value: (r) => r.available },
          { header: "Alert level", value: (r) => r.lowStockThreshold },
          { header: "Cost price", value: (r) => r.costPrice ?? "" },
          { header: "Price", value: (r) => r.price },
          { header: "Sold 30d online", value: (r) => r.sold30.online },
          { header: "Sold 30d shop", value: (r) => r.sold30.offline },
          { header: "Status", value: (r) => STATUS_LABEL[r.status], width: 14 },
        ],
        "Inventory"
      );
    } catch (err) {
      toast.error(apiError(err, "Export failed"));
    } finally {
      setExporting(false);
    }
  };

  const importConfig = useMemo(() => stockImportConfig(importMode, setImportMode), [importMode]);
  const filtered = status !== "all" || categoryId !== "ALL" || !!search;

  const SortHead = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => {
    const active = sort === k;
    const Icon = !active ? ArrowUpDown : order === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className} aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}>
        <button
          type="button"
          onClick={() => toggleSort(k)}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground transition",
            active && "text-foreground",
            className?.includes("text-right") && "flex-row-reverse"
          )}
        >
          {children}
          <Icon className={cn("h-3.5 w-3.5", !active && "opacity-40")} />
        </button>
      </TableHead>
    );
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="One stock pool for the online store and the shop. Every change is recorded."
      >
        <Button variant="outline" onClick={exportAll} disabled={exporting}>
          <Download className="h-4 w-4 mr-1.5" />
          {exporting ? "Exporting…" : "Export"}
        </Button>
        <Button onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-1.5" /> Import stock
        </Button>
      </PageHeader>

      <SummaryCards
        summary={summary}
        status={status}
        onStatus={(s) => {
          setTab("levels");
          setStatus((cur) => (cur === s ? "all" : s));
        }}
      />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="levels">
            <Boxes className="h-4 w-4 mr-1.5" /> Stock levels
          </TabsTrigger>
          <TabsTrigger value="ledger">
            <History className="h-4 w-4 mr-1.5" /> Stock history
          </TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1 lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by product or SKU…"
                className="pl-9"
                aria-label="Search inventory"
              />
            </div>
            <div className="flex rounded-md border bg-card p-0.5" role="radiogroup" aria-label="Stock status">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={status === f.value}
                  onClick={() => setStatus(f.value)}
                  className={cn(
                    "flex-1 rounded px-3 py-1.5 text-sm transition whitespace-nowrap",
                    status === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="lg:w-52" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtered && (
              <Button
                variant="ghost"
                onClick={() => {
                  setStatus("all");
                  setCategoryId("ALL");
                  setSearchInput("");
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table className="min-w-[920px]">
              <TableHeader>
                <TableRow>
                  <SortHead k="title">Product</SortHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <SortHead k="available" className="text-right">
                    Available
                  </SortHead>
                  <TableHead className="text-right">Alert at</TableHead>
                  <SortHead k="sold" className="text-right">
                    Sold 30d
                  </SortHead>
                  <SortHead k="value" className="text-right">
                    Value
                  </SortHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-14 text-center text-muted-foreground">
                      {filtered ? "No products match these filters." : "No products yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow
                      key={r.productId}
                      className={cn("cursor-pointer", loading && "opacity-60")}
                      onClick={() => setViewing(r)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-none overflow-hidden rounded-md border bg-muted">
                            {r.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.imageUrl} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-medium leading-tight">
                              <span className="truncate max-w-[16rem]">{r.title}</span>
                              {!r.isActive && (
                                <Badge variant="outline" className="text-[10px] font-normal">
                                  Hidden
                                </Badge>
                              )}
                            </div>
                            <div className="font-mono text-xs text-muted-foreground">{r.sku}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.category?.name ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.stock}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{r.reserved || "—"}</TableCell>
                      <TableCell className="text-right">
                        <StatusBadge row={r} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{r.lowStockThreshold}</TableCell>
                      <TableCell className="text-right">
                        <div className="tabular-nums font-medium">{r.sold30.total}</div>
                        {r.sold30.total > 0 && (
                          <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {r.sold30.online} online · {r.sold30.offline} shop
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{inr(Math.max(r.stock, 0) * r.price)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setAdjusting(r)}>
                            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> Adjust
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setViewing(r)}
                            aria-label={`History for ${r.title}`}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pager page={page} totalPages={totalPages} total={total} noun="product" onPage={setPage} />
        </TabsContent>

        <TabsContent value="ledger" className="mt-4">
          <LedgerTab refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>

      <AdjustDialog row={adjusting} onOpenChange={(v) => !v && setAdjusting(null)} onSaved={refresh} />
      <HistorySheet
        row={viewing}
        refreshKey={refreshKey}
        onOpenChange={(v) => !v && setViewing(null)}
        onAdjust={(r) => setAdjusting(r)}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} config={importConfig} onDone={refresh} />
    </div>
  );
}

function SummaryCards({
  summary,
  status,
  onStatus,
}: {
  summary: InventorySummary | null;
  status: StatusFilter;
  onStatus: (s: StockStatus) => void;
}) {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] w-full" />
        ))}
      </div>
    );
  }

  const sold = summary.sold30Online + summary.sold30Offline;
  const onlineShare = sold ? Math.round((summary.sold30Online / sold) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Stat icon={Boxes} label="Units on hand" value={summary.units.toLocaleString("en-IN")}>
        {summary.skus} SKUs{summary.reserved > 0 && ` · ${summary.reserved} reserved`}
      </Stat>
      <Stat icon={IndianRupee} label="Stock value" value={inr(Math.round(summary.retailValue))}>
        {summary.costValue > 0 ? `${inr(Math.round(summary.costValue))} at cost` : "at selling price"}
        {summary.missingCost > 0 && ` · ${summary.missingCost} without cost`}
      </Stat>
      <Stat icon={TrendingUp} label="Sold, last 30 days" value={sold.toLocaleString("en-IN")}>
        <span className="flex items-center gap-2">
          {summary.sold30Online} online · {summary.sold30Offline} shop
        </span>
        {sold > 0 && (
          <span className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-accent/30" aria-hidden>
            <span className="bg-primary" style={{ width: `${onlineShare}%` }} />
          </span>
        )}
      </Stat>
      <Stat
        icon={AlertTriangle}
        label="Low stock"
        value={summary.low}
        tone={summary.low > 0 ? "warn" : undefined}
        active={status === "low"}
        onClick={() => onStatus("low")}
      >
        {status === "low" ? "Showing low stock" : "At or below alert level"}
      </Stat>
      <Stat
        icon={PackageX}
        label="Out of stock"
        value={summary.out}
        tone={summary.out > 0 ? "danger" : undefined}
        active={status === "out"}
        onClick={() => onStatus("out")}
        className="col-span-2 lg:col-span-1"
      >
        {status === "out" ? "Showing out of stock" : "Nothing available to sell"}
      </Stat>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  children,
  tone,
  active,
  onClick,
  className,
}: {
  icon: typeof Boxes;
  label: string;
  value: React.ReactNode;
  children?: React.ReactNode;
  tone?: "warn" | "danger";
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const body = (
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "warn" ? "text-amber-600" : tone === "danger" ? "text-destructive" : "text-accent"
          )}
        />
      </div>
      <div
        className={cn(
          "mt-1.5 font-display text-3xl leading-none tabular-nums",
          tone === "warn" && "text-amber-700 dark:text-amber-400",
          tone === "danger" && "text-destructive"
        )}
      >
        {value}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{children}</div>
    </CardContent>
  );
  return (
    <Card className={cn(onClick && "transition hover:border-accent", active && "border-accent ring-1 ring-accent", className)}>
      {onClick ? (
        <button type="button" onClick={onClick} className="block w-full text-left" aria-pressed={active}>
          {body}
        </button>
      ) : (
        body
      )}
    </Card>
  );
}
