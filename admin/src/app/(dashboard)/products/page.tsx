"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Star } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { inr } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ProductDialog } from "./product-dialog";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const searchParam = query ? `&search=${encodeURIComponent(query)}` : "";
      const [prod, cats] = await Promise.all([
        api.get(`/catalog?limit=200&includeInactive=true${searchParam}`),
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

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/catalog/${deleting.id}`);
      toast.success("Product deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not delete product"));
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

  return (
    <div>
      <PageHeader title="Products" description="Manage your catalogue, pricing and stock.">
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1.5" /> New Product
        </Button>
      </PageHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
        }}
        className="relative max-w-sm mb-5"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="pl-9"
        />
      </form>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No products yet. Create your first product to get started.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
                const stock = p.inventory
                  ? p.inventory.stock - p.inventory.reserved
                  : 0;
                const onSale = p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-md overflow-hidden bg-muted border flex-none">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate flex items-center gap-1.5">
                            {p.isFeatured && (
                              <Star className="h-3.5 w-3.5 text-accent fill-accent flex-none" />
                            )}
                            {p.title}
                          </div>
                          <div className="text-xs text-muted-foreground">{p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{inr(p.price)}</div>
                      {onSale && (
                        <div className="text-xs text-muted-foreground line-through">
                          {inr(p.compareAtPrice)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={stock <= 5 ? "text-destructive font-medium" : ""}>
                        {stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
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

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; and its inventory will be permanently
              removed. This cannot be undone.
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
    </div>
  );
}
