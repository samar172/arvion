"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, PackageMinus, PackagePlus, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import api, { apiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InventoryRow } from "./types";

type Mode = "add" | "remove" | "set";

const MODES: { value: Mode; label: string; hint: string; icon: typeof PackagePlus }[] = [
  { value: "add", label: "Receive stock", hint: "Goods arrived from a supplier", icon: PackagePlus },
  { value: "remove", label: "Remove stock", hint: "Damaged, lost or sent back", icon: PackageMinus },
  { value: "set", label: "Recount", hint: "Set the exact count on the shelf", icon: ClipboardCheck },
];

/** Reasons for taking stock out; several map to the same ledger type. */
const REMOVE_REASONS = [
  { value: "damage", label: "Damaged or lost", type: "DAMAGE" },
  { value: "supplier", label: "Returned to supplier", type: "ADJUSTMENT" },
  { value: "correction", label: "Correction", type: "ADJUSTMENT" },
] as const;

export function AdjustDialog({
  row,
  onOpenChange,
  onSaved,
}: {
  row: InventoryRow | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<Mode>("add");
  const [quantity, setQuantity] = useState("");
  const [removeReason, setRemoveReason] = useState<(typeof REMOVE_REASONS)[number]["value"]>("damage");
  const [note, setNote] = useState("");
  const [threshold, setThreshold] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    setMode("add");
    setQuantity("");
    setRemoveReason("damage");
    setNote("");
    setThreshold(String(row.lowStockThreshold));
  }, [row]);

  if (!row) return null;

  const qty = quantity === "" ? null : Number(quantity);
  const qtyValid = qty !== null && Number.isInteger(qty) && qty >= 0 && (mode === "set" || qty > 0);
  const next =
    qty === null || !qtyValid
      ? null
      : mode === "add"
        ? row.stock + qty
        : mode === "remove"
          ? row.stock - qty
          : qty;
  const thresholdNum = Number(threshold);
  const thresholdValid = threshold !== "" && Number.isInteger(thresholdNum) && thresholdNum >= 0;
  const thresholdChanged = thresholdValid && thresholdNum !== row.lowStockThreshold;
  const stockChanged = next !== null && next !== row.stock;
  const tooMuch = next !== null && next < 0;
  const canSave = !saving && !tooMuch && thresholdValid && (stockChanged || thresholdChanged) && (quantity === "" || qtyValid);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (stockChanged) {
        body.mode = mode;
        body.quantity = qty;
        body.reason =
          mode === "add"
            ? "RESTOCK"
            : mode === "set"
              ? "ADJUSTMENT"
              : REMOVE_REASONS.find((r) => r.value === removeReason)!.type;
        const reasonLabel = mode === "remove" ? REMOVE_REASONS.find((r) => r.value === removeReason)!.label : "";
        body.note = [reasonLabel && removeReason !== "damage" ? reasonLabel : "", note.trim()]
          .filter(Boolean)
          .join(" · ") || undefined;
      }
      if (thresholdChanged) body.lowStockThreshold = thresholdNum;
      await api.post(`/inventory/${row.productId}/adjust`, body);
      toast.success(stockChanged ? `${row.title}: ${row.stock} → ${next}` : "Alert level updated");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(apiError(err, "Could not update stock"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!row} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Adjust stock</DialogTitle>
          <DialogDescription>
            {row.title} · <span className="font-mono">{row.sku}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Adjustment type">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition",
                mode === m.value ? "border-accent bg-accent/10 ring-1 ring-accent" : "hover:border-accent/60"
              )}
            >
              <m.icon className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium leading-tight">{m.label}</span>
              <span className="hidden sm:block text-[11px] text-muted-foreground leading-snug">{m.hint}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adj-qty">{mode === "set" ? "Counted on shelf" : "Quantity"}</Label>
            <Input
              id="adj-qty"
              type="number"
              inputMode="numeric"
              min={0}
              autoFocus
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={mode === "set" ? String(row.stock) : "0"}
            />
          </div>
          {mode === "remove" ? (
            <div className="flex flex-col gap-1.5">
              <Label>Reason</Label>
              <div className="flex flex-wrap gap-1.5">
                {REMOVE_REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRemoveReason(r.value)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition",
                      removeReason === r.value ? "border-accent bg-accent/15 text-foreground" : "text-muted-foreground hover:border-accent/60"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adj-threshold">Low-stock alert at</Label>
              <Input
                id="adj-threshold"
                type="number"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          )}
        </div>

        {mode === "remove" && (
          <div className="flex flex-col gap-1.5 sm:w-1/2">
            <Label htmlFor="adj-threshold-r">Low-stock alert at</Label>
            <Input id="adj-threshold-r" type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="adj-note">Note (optional)</Label>
          <Textarea
            id="adj-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === "add" ? "Supplier, invoice no." : "What happened"}
          />
        </div>

        <div
          className={cn(
            "flex items-center justify-between rounded-md px-4 py-3 text-sm",
            tooMuch ? "bg-destructive/10 text-destructive" : "bg-muted/60"
          )}
        >
          <span className="text-muted-foreground">On hand</span>
          <span className="flex items-center gap-2 font-medium tabular-nums">
            {row.stock}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className={cn(stockChanged && !tooMuch && "text-accent-foreground font-semibold")}>
              {next ?? row.stock}
            </span>
          </span>
        </div>
        {tooMuch && <p className="-mt-2 text-xs text-destructive">Only {row.stock} on hand.</p>}
        {row.reserved > 0 && (
          <p className="-mt-2 text-xs text-muted-foreground">
            {row.reserved} held for unpaid online orders.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
