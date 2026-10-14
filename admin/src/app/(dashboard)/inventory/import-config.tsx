"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { num, pick, text } from "@/lib/excel";
import { RowStatus, type ImportConfig } from "@/components/import/import-dialog";

export type StockImportMode = "set" | "add";

interface StockImportRow {
  sku?: string;
  quantity: number;
  line: number;
}

const MODES: { value: StockImportMode; label: string; hint: string }[] = [
  { value: "set", label: "Stock count", hint: "Set on-hand to the number in the sheet" },
  { value: "add", label: "Goods received", hint: "Add the sheet's quantity to on-hand" },
];

function ModePicker({ mode, onChange }: { mode: StockImportMode; onChange: (m: StockImportMode) => void }) {
  return (
    <div className="grid w-full grid-cols-2 gap-2" role="radiogroup" aria-label="Import mode">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          role="radio"
          aria-checked={mode === m.value}
          onClick={() => onChange(m.value)}
          className={cn(
            "rounded-md border px-3 py-2.5 text-left transition",
            mode === m.value ? "border-accent bg-accent/10 ring-1 ring-accent" : "hover:border-accent/60"
          )}
        >
          <div className="text-sm font-medium">{m.label}</div>
          <div className="text-xs text-muted-foreground">{m.hint}</div>
        </button>
      ))}
    </div>
  );
}

export function stockImportConfig(
  mode: StockImportMode,
  setMode: (m: StockImportMode) => void
): ImportConfig<StockImportRow> {
  return {
    title: "Import stock",
    description:
      mode === "set"
        ? "Upload a stock count. Each SKU's on-hand quantity becomes the number in your sheet."
        : "Upload goods received. Each quantity is added to what's already on hand.",
    endpoint: "/inventory/import",
    extra: { mode },
    options: <ModePicker mode={mode} onChange={setMode} />,
    template: {
      filename: "Stock-template.xlsx",
      headers: ["SKU", "Quantity"],
      examples: [
        ["HMP-EID-01", 24],
        ["AT-OUD-01", 18],
      ],
    },
    mapRow: (row) => ({
      sku: text(pick(row, "sku", "SKU code", "item code")),
      quantity: num(pick(row, "quantity", "qty", "stock", "count", "on hand")) ?? Number.NaN,
      line: row.__line,
    }),
    columns: [
      { header: "SKU", cell: (r) => <span className="font-mono text-xs">{r.sku || "—"}</span> },
      { header: "Product", cell: (r) => r.title ?? <span className="text-muted-foreground">—</span> },
      {
        header: "On hand",
        className: "whitespace-nowrap",
        cell: (r) =>
          r.status === "error" ? (
            <span className="text-muted-foreground tabular-nums">{r.title ? r.current : "—"}</span>
          ) : (
            <span className="flex items-center gap-1.5 tabular-nums">
              {r.current}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={cn(r.status === "ok" && "font-semibold")}>{r.next}</span>
            </span>
          ),
      },
      {
        header: "Status",
        cell: (r) => (
          <RowStatus
            error={r.status === "error"}
            message={r.message}
            label={r.status === "unchanged" ? "No change" : r.delta > 0 ? `+${r.delta}` : `${r.delta}`}
          />
        ),
      },
    ],
    isError: (r) => r.status === "error",
    isNoop: (r) => r.status === "unchanged",
    summary: (res) => [
      { label: `${res.changes} to update` },
      ...(res.rows.length - res.changes - res.errors > 0
        ? [{ label: `${res.rows.length - res.changes - res.errors} unchanged`, tone: "muted" as const }]
        : []),
      ...(res.errors ? [{ label: `${res.errors} error${res.errors === 1 ? "" : "s"}`, tone: "error" as const }] : []),
    ],
    applyLabel: (res) => `Update ${res?.changes ?? 0} product${res?.changes === 1 ? "" : "s"}`,
  };
}
