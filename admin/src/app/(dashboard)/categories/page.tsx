"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { PageHeader } from "@/components/shell/page-header";
import { ImageField } from "@/components/form/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const EMPTY = { name: "", slug: "", description: "", imageUrl: "" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/category");
      setCategories(res.data || []);
    } catch (err) {
      toast.error(apiError(err, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setSlugTouched(false);
    setOpen(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      imageUrl: c.imageUrl ?? "",
    });
    setSlugTouched(true);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
    };
    try {
      if (editing) {
        await api.patch(`/category/${editing.id}`, payload);
        toast.success("Category updated");
      } else {
        await api.post("/category", payload);
        toast.success("Category created");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not save category"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/category/${deleting.id}`);
      toast.success("Category deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not delete category"));
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organise products into collections shown across the store."
      >
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1.5" /> New Category
        </Button>
      </PageHeader>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No categories yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="h-28 bg-muted">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[repeating-linear-gradient(135deg,#efe7d4_0_10px,#f5eede_10px_20px)]" />
                )}
              </div>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl truncate">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">/{c.slug}</p>
                  </div>
                  <div className="flex gap-1 flex-none">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {c.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {c.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editing ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f: any) => ({
                    ...f,
                    name,
                    slug: slugTouched ? f.slug : slugify(name),
                  }));
                }}
                placeholder="Quran Gift Sets"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f: any) => ({ ...f, slug: slugify(e.target.value) }));
                }}
                placeholder="quran-gift-sets"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <ImageField
              label="Category image"
              value={form.imageUrl}
              onChange={(url) => setForm((f: any) => ({ ...f, imageUrl: url }))}
            />
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
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting?.name}&rdquo; will be removed. Products in it are not
              deleted, but become uncategorised.
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
