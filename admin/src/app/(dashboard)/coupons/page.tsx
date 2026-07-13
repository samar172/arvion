"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { inr, dateShort } from "@/lib/format";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  code: "",
  type: "PERCENT",
  value: "",
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  expiresAt: "",
  active: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/coupons");
      setCoupons(res.data || []);
    } catch (err) {
      toast.error(apiError(err, "Failed to load coupons"));
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
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      active: c.active,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.value) {
      toast.error("Code and value are required.");
      return;
    }
    setSaving(true);
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      active: form.active,
    };
    if (form.minOrderAmount) payload.minOrderAmount = Number(form.minOrderAmount);
    if (form.maxDiscount) payload.maxDiscount = Number(form.maxDiscount);
    if (form.usageLimit) payload.usageLimit = Number(form.usageLimit);
    if (form.expiresAt) {
      payload.expiresAt = new Date(form.expiresAt + "T23:59:59").toISOString();
    }

    try {
      if (editing) {
        await api.patch(`/coupons/${editing.id}`, payload);
        toast.success("Coupon updated");
      } else {
        await api.post("/coupons", payload);
        toast.success("Coupon created");
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not save coupon"));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: any) => {
    try {
      await api.patch(`/coupons/${c.id}`, { active: !c.active });
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not update coupon"));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/coupons/${deleting.id}`);
      toast.success("Coupon deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(apiError(err, "Could not delete coupon"));
    }
  };

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply at checkout."
      >
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1.5" /> New Coupon
        </Button>
      </PageHeader>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min order</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No coupons yet.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>
                    {c.type === "PERCENT" ? `${Number(c.value)}%` : inr(c.value)}
                    {c.maxDiscount ? (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        (max {inr(c.maxDiscount)})
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.minOrderAmount ? inr(c.minOrderAmount) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.expiresAt ? dateShort(c.expiresAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editing ? "Edit Coupon" : "New Coupon"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="EID20"
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>{form.type === "PERCENT" ? "Percent off" : "Amount off (₹)"}</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Max discount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => set("maxDiscount", e.target.value)}
                  placeholder="Optional cap"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Min order (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.minOrderAmount}
                  onChange={(e) => set("minOrderAmount", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Usage limit</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) => set("usageLimit", e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <Label>Expires on</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => set("expiresAt", e.target.value)}
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
            <AlertDialogTitle>Delete this coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              Code &ldquo;{deleting?.code}&rdquo; will stop working immediately.
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
