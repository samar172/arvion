"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Star,
  Upload,
  Download,
  Eye,
  EyeOff,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { ImportDialog } from "@/components/import/import-dialog";
import { ProductDialog } from "./product-dialog";
import { exportProducts, productImportConfig } from "./product-sheet";

type StatusFilter = "all" | "active" | "hidden" | "featured" | "low" | "out";
type SortKey = "newest" | "title" | "price" | "stock";
type BulkAction = "activate" | "hide" | "feature" | "unfeature" | "delete";

const STATUS_LABEL: Record<StatusFilter, string> = {
  all: "All products",
  active: "Active",
  hidden: "Hidden",
  featured: "Featured",
  low: "Low stock",
  out: "Out of stock",
};

const SORT_LABEL: Record<SortKey, string> = {
  newest: "Newest first",
  title: "Name A–Z",
  price: "Price: high to low",
  stock: "Stock: low to high",
};

const BULK_DONE: Record<Exclude<BulkAction, "delete">, string> = {
  activate: "shown in the store",
  hide: "hidden from the store",
  feature: "featured",
  unfeature: "unfeatured",
};

const available = (p: any) => (p.inventory ? p.inventory.stock - p.inventory.reserved : 0);
const threshold = (p: any) => p.inventory?.lowStockThreshold ?? 5;

function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate && !checked;
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer rounded border-input accent-[hsl(var(--primary))]"
    />
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  // Debounce typing into the server-side search (which also matches descriptions).
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const searchParam = query ? `&search=${encodeURIComponent(query)}` : "";
      const [prod, cats] = await Promise.all([
        api.get(`/catalog?limit=1000&includeInactive=true&sort=newest${searchParam}`),
        api.get("/category"),
      ]);
      setProducts(prod.data.data || []);
      setCategories(cats.data || []);
    } catch (err) {
      toast.error(apiError(err, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const list = products.filter((p) => {
      if (categoryId !== "all" && (p.categoryId ?? p.category?.id) !== categoryId) return false;
      const left = available(p);
      switch (status) {
        case "active":
          return p.isActive;
        case "hidden":
          return !p.isActive;
        case "featured":
          return p.isFeatured;
        case "low":
          return left > 0 && left <= threshold(p);
        case "out":
          return left <= 0;
        default:
          return true;
      }
    });
    const sorted = [...list];
    if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "price") sorted.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "stock") sorted.sort((a, b) => available(a) - available(b));
    if (sort === "newest")
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted;
  }, [products, categoryId, status, sort]);

  // Selection only ever refers to rows the admin can currently see.
  useEffect(() => {
    setSelected((s) => {
      const ids = new Set(visible.map((p) => p.id));
      const next = new Set(Array.from(s).filter((id) => ids.has(id)));
      return next.size === s.size ? s : next;
    });
  }, [visible]);

  const allSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));
  const someSelected = selected.size > 0;

  const toggleAll = (v: boolean) => setSelected(v ? new Set(visible.map((p) => p.id)) : new Set());
  const toggleOne = (id: string, v: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      if (v) next.add(id);
      else next.delete(id);
      return next;
    });

  const patchProduct = async (p: any, data: Record<string, boolean>, done: string) => {
    const before = { ...p };
    setProducts((ps) => ps.map((x) => (x.id === p.id ? { ...x, ...data } : x)));
    try {
      await api.patch(`/catalog/${p.id}`, data);
      toast.success(done);
    } catch (err) {
      setProducts((ps) => ps.map((x) => (x.id === p.id ? before : x)));
      toast.error(apiError(err, "Could not update product"));
    }
  };

  const runBulk = async (action: BulkAction) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const res = await api.post("/catalog/bulk", { ids, action });
      if (action === "delete") {
        const { deleted = 0, hidden = 0 } = res.data ?? {};
        const parts = [];
        if (deleted) parts.push(`${deleted} deleted`);
        if (hidden) parts.push(`${hidden} hidden (they have past orders)`);
        toast.success(parts.join(" · ") || "Nothing changed");
      } else {
        toast.success(`${ids.length} product${ids.length === 1 ? "" : "s"} ${BULK_DONE[action]}`);
      }
      setSelected(new Set());
      setConfirmBulkDelete(false);
      load();
    } catch (err) {
      toast.error(apiError(err, "Bulk update failed"));
    } finally {
      setBulkBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const product = deleting;
    setDeleting(null);
    try {
      await api.delete(`/catalog/${product.id}`);
      toast.success("Product deleted");
      load();
    } catch (err: any) {
      const message = apiError(err, "Could not delete product");
      if (err?.response?.status === 400 && product.isActive) {
        toast.error(message, {
          duration: 8000,
          action: {
            label: "Hide instead",
            onClick: () => patchProduct(product, { isActive: false }, "Product hidden from the store"),
          },
        });
      } else {
        toast.error(message);
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProducts(visible);
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const filtersActive = !!query || categoryId !== "all" || status !== "all";

  return (
    <div>
      <PageHeader title="Products" description="Manage your catalogue, pricing and margins.">
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button variant="outline" onClick={handleExport} disabled={exporting || !visible.length}>
          {exporting ? (
            <Loader2 className="h-4 w-4 sm:mr-1.5 animate-spin" />
          ) : (
            <Download className="h-4 w-4 sm:mr-1.5" />
          )}
          <span className="hidden sm:inline">Export</span>
        </Button>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1.5" /> New Product
        </Button>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU or description…"
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:flex">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="lg:w-44" aria-label="Category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="lg:w-40" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {STATUS_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="lg:w-44" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {SORT_LABEL[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 min-h-9">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading…" : `${visible.length} product${visible.length === 1 ? "" : "s"}`}
          {(categoryId !== "all" || status !== "all") && !loading && ` of ${products.length}`}
          {query && !loading && ` matching “${query}”`}
        </p>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setCategoryId("all");
              setStatus("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {someSelected && (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-primary px-3 py-2 text-primary-foreground shadow-lg">
          <span className="text-sm font-medium mr-1">{selected.size} selected</span>
          <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => runBulk("activate")}>
            <Eye className="h-4 w-4 mr-1" /> Show
          </Button>
          <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => runBulk("hide")}>
            <EyeOff className="h-4 w-4 mr-1" /> Hide
          </Button>
          <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => runBulk("feature")}>
            <Star className="h-4 w-4 mr-1" /> Feature
          </Button>
          <Button size="sm" variant="secondary" disabled={bulkBusy} onClick={() => runBulk("unfeature")}>
            Unfeature
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={bulkBusy}
            onClick={() => setConfirmBulkDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
          <span className="flex-1" />
          {bulkBusy && <Loader2 className="h-4 w-4 animate-spin" />}
          <Button
            size="sm"
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  label="Select all products"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAll}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  {products.length === 0
                    ? "No products yet. Create one, or import a spreadsheet to add many at once."
                    : "No products match these filters."}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((p) => {
                const left = available(p);
                const price = Number(p.price);
                const cost = p.costPrice != null ? Number(p.costPrice) : null;
                const marginPct = cost != null && price > 0 ? ((price - cost) / price) * 100 : null;
                const onSale = p.compareAtPrice && Number(p.compareAtPrice) > price;
                const isSelected = selected.has(p.id);
                return (
                  <TableRow
                    key={p.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(!p.isActive && "opacity-70")}
                  >
                    <TableCell>
                      <Checkbox
                        label={`Select ${p.title}`}
                        checked={isSelected}
                        onChange={(v) => toggleOne(p.id, v)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-md overflow-hidden bg-muted border flex-none">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[16rem] flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={p.isFeatured ? "Remove from featured" : "Mark as featured"}
                              aria-pressed={p.isFeatured}
                              title={p.isFeatured ? "Featured — click to remove" : "Mark as featured"}
                              onClick={() =>
                                patchProduct(
                                  p,
                                  { isFeatured: !p.isFeatured },
                                  p.isFeatured ? "Removed from featured" : "Marked as featured"
                                )
                              }
                              className="flex-none rounded p-0.5 hover:bg-muted"
                            >
                              <Star
                                className={cn(
                                  "h-3.5 w-3.5",
                                  p.isFeatured ? "text-accent fill-accent" : "text-muted-foreground/50"
                                )}
                              />
                            </button>
                            <span className="truncate">{p.title}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="font-medium">{inr(price)}</div>
                      {onSale && (
                        <div className="text-xs text-muted-foreground line-through">
                          {inr(p.compareAtPrice)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {cost != null ? inr(cost) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {marginPct != null ? (
                        <span className={cn(marginPct < 0 ? "text-destructive font-medium" : "")}>
                          {marginPct.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {left <= 0 ? (
                        <Badge variant="destructive">Out</Badge>
                      ) : left <= threshold(p) ? (
                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                          {left} low
                        </span>
                      ) : (
                        left
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={p.isActive}
                        aria-label={p.isActive ? `Hide ${p.title}` : `Show ${p.title}`}
                        onCheckedChange={(v) =>
                          patchProduct(p, { isActive: v }, v ? "Shown in the store" : "Hidden from the store")
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${p.title}`}
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${p.title}`}
                          className="text-destructive"
                          onClick={() => setDeleting(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories}
        onSaved={load}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        config={productImportConfig}
        onDone={load}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; and its inventory will be permanently removed. Products
              that appear in past orders can&apos;t be deleted; hide them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmBulkDelete} onOpenChange={(v) => !bulkBusy && setConfirmBulkDelete(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} product{selected.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Products with no order history are permanently removed with their inventory. Any that
              appear in past orders are hidden from the store instead, so your sales records stay intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                runBulk("delete");
              }}
              disabled={bulkBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkBusy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
