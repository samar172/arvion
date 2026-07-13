"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageField } from "@/components/form/image-field";

interface Category {
  id: string;
  name: string;
}

const EMPTY = {
  title: "",
  description: "",
  price: "",
  compareAtPrice: "",
  sku: "",
  categoryId: "",
  imageUrl: "",
  stock: "",
  halalCertified: true,
  isFeatured: false,
  isActive: true,
};

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: any | null;
  categories: Category[];
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState<any>(EMPTY);
  const [gallery, setGallery] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (product) {
      let extra: string[] = [];
      try {
        extra = product.images ? JSON.parse(product.images) : [];
      } catch {
        extra = [];
      }
      setForm({
        title: product.title ?? "",
        description: product.description ?? "",
        price: String(product.price ?? ""),
        compareAtPrice: product.compareAtPrice
          ? String(product.compareAtPrice)
          : "",
        sku: product.sku ?? "",
        categoryId: product.categoryId ?? product.category?.id ?? "",
        imageUrl: product.imageUrl ?? "",
        stock: String(product.inventory?.stock ?? ""),
        halalCertified: product.halalCertified ?? true,
        isFeatured: product.isFeatured ?? false,
        isActive: product.isActive ?? true,
      });
      setGallery(Array.isArray(extra) ? extra : []);
    } else {
      setForm(EMPTY);
      setGallery([]);
    }
  }, [open, product]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.sku) {
      toast.error("Title, price and SKU are required.");
      return;
    }
    setSaving(true);

    const cleanGallery = gallery.filter(Boolean);
    const payload: any = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      sku: form.sku,
      categoryId: form.categoryId || undefined,
      imageUrl: form.imageUrl || undefined,
      images: cleanGallery.length ? JSON.stringify(cleanGallery) : undefined,
      halalCertified: form.halalCertified,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };
    // A blank compare-at price clears any existing sale (service maps 0 -> null).
    payload.compareAtPrice = form.compareAtPrice ? Number(form.compareAtPrice) : 0;

    try {
      if (isEdit) {
        await api.patch(`/catalog/${product.id}`, payload);
      } else {
        await api.post("/catalog", { ...payload, stock: Number(form.stock) || 0 });
      }
      toast.success(isEdit ? "Product updated" : "Product created");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err, "Could not save product"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isEdit ? "Edit Product" : "New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Deluxe Quran Gift Set"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="A short description shown on the product page…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Compare-at price (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                placeholder="Leave blank for no sale"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="RIZ-QURAN-001"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.categoryId || "none"}
                onValueChange={(v) => set("categoryId", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Uncategorised" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorised</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5 max-w-[50%]">
              <Label>Initial stock</Label>
              <Input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          <div>
            <ImageField
              label="Main image"
              value={form.imageUrl}
              onChange={(url) => set("imageUrl", url)}
            />
          </div>

          {/* Gallery images */}
          <div>
            <div className="text-sm font-medium mb-1.5">Gallery</div>
            <div className="flex flex-wrap gap-3">
              {gallery.map((img, i) => (
                <ImageField
                  key={i}
                  label=""
                  value={img}
                  onChange={(url) =>
                    setGallery((g) =>
                      url ? g.map((x, xi) => (xi === i ? url : x)) : g.filter((_, xi) => xi !== i)
                    )
                  }
                />
              ))}
              <ImageField
                label=""
                value=""
                onChange={(url) => url && setGallery((g) => [...g, url])}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => set("isActive", v)}
              />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={form.isFeatured}
                onCheckedChange={(v) => set("isFeatured", v)}
              />
              <span className="text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={form.halalCertified}
                onCheckedChange={(v) => set("halalCertified", v)}
              />
              <span className="text-sm">Halal certified</span>
            </label>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
