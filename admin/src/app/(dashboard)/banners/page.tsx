"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { PageHeader } from "@/components/shell/page-header";
import { ImageField } from "@/components/form/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const EMPTY = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  link: "",
  sortOrder: "0",
  active: true,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/banners");
      setBanners(res.data || []);
    } catch (err) {
      toast.error(apiError(err, "Failed to load banners"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, sortOrder: String(banners.length) });
    setOpen(true);
  };
  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      imageUrl: b.imageUrl ?? "",
      ctaLabel: b.ctaLabel ?? "",
      link: b.link ?? "",
      sortOrder: String(b.sortOrder ?? 0),
      active: b.active ?? true,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      subtitle: form.subtitle || undefined,
      imageUrl: form.imageUrl || undefined,
      ctaLabel: form.ctaLabel || undefined,
      link: form.link || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      if (editing) {
        await api.patch(`/banners/${editing.id}`, payload);
        toast.success("Banner updated");
      } else {
        await api.post("/banners", payload);
        toast.success("Banner created");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not save banner"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: any) => {
    try {
      await api.patch(`/banners/${b.id}`, { active: !b.active });
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not update banner"));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/banners/${deleting.id}`);
      toast.success("Banner deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not delete banner"));
    }
  };

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Promotional slides shown on the storefront home page, ordered by sort value."
      >
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1.5" /> New Banner
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No banners yet. Add one to feature it on the home page.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-4 flex items-center gap-4">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-none" />
                <div className="w-28 h-16 rounded-md overflow-hidden bg-muted border flex-none">
                  {b.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[repeating-linear-gradient(135deg,#efe7d4_0_10px,#f5eede_10px_20px)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{b.title}</span>
                    {!b.active && <Badge variant="outline">Hidden</Badge>}
                  </div>
                  {b.subtitle && (
                    <p className="text-sm text-muted-foreground truncate">{b.subtitle}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Order {b.sortOrder}
                    {b.link ? ` · → ${b.link}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <Switch checked={b.active} onCheckedChange={() => toggleActive(b)} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleting(b)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editing ? "Edit Banner" : "New Banner"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
            </div>
            <ImageField
              label="Banner image"
              value={form.imageUrl}
              onChange={(url) => set("imageUrl", url)}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>CTA label</Label>
                <Input
                  value={form.ctaLabel}
                  onChange={(e) => set("ctaLabel", e.target.value)}
                  placeholder="Shop Now"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Link</Label>
                <Input
                  value={form.link}
                  onChange={(e) => set("link", e.target.value)}
                  placeholder="/category/gift-hampers"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer h-10">
                <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
                <span className="text-sm">Active</span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be removed from the home page.
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
