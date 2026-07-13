"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Check } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { inr } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

const LOW_STOCK = 10;

export default function InventoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory");
      setRows(res.data || []);
    } catch (err) {
      toast.error(apiError(err, "Failed to load inventory"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (productId: string) => {
    const draft = drafts[productId];
    if (draft === undefined) return;
    const stock = Number(draft);
    if (Number.isNaN(stock) || stock < 0) {
      toast.error("Enter a valid stock number.");
      return;
    }
    setSavingId(productId);
    try {
      await api.put(`/inventory/${productId}`, { stock });
      toast.success("Stock updated");
      setDrafts((d) => {
        const next = { ...d };
        delete next[productId];
        return next;
      });
      setRows((rs) =>
        rs.map((r) => (r.productId === productId ? { ...r, stock } : r))
      );
    } catch (err) {
      toast.error(apiError(err, "Could not update stock"));
    } finally {
      setSavingId(null);
    }
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.product?.title?.toLowerCase().includes(q) ||
      r.product?.sku?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Adjust stock levels. Available = stock − reserved."
      />

      <div className="relative max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or SKU…"
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Available</TableHead>
              <TableHead className="w-48">Stock</TableHead>
              <TableHead></TableHead>
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
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const reserved = r.reserved ?? 0;
                const available = (r.stock ?? 0) - reserved;
                const draft = drafts[r.productId];
                const dirty = draft !== undefined && Number(draft) !== r.stock;
                return (
                  <TableRow key={r.productId}>
                    <TableCell>
                      <div className="font-medium">{r.product?.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.product?.sku} · {inr(r.product?.price)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {reserved}
                    </TableCell>
                    <TableCell className="text-right">
                      {available <= LOW_STOCK ? (
                        <Badge variant="destructive">{available}</Badge>
                      ) : (
                        <span>{available}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={draft ?? String(r.stock ?? 0)}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [r.productId]: e.target.value }))
                        }
                        className="h-9"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={dirty ? "default" : "ghost"}
                        disabled={!dirty || savingId === r.productId}
                        onClick={() => save(r.productId)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {savingId === r.productId ? "…" : "Save"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
