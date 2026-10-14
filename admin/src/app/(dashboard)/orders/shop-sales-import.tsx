"use client";

import { ImportDialog, RowStatus, type ImportConfig } from "@/components/import/import-dialog";
import { pick, text, num, isoDate, type SheetRow } from "@/lib/excel";
import { inr, PAYMENT_METHODS, type PaymentMethod } from "@/lib/format";

interface ShopSaleRow {
  line: number;
  bill?: string;
  date?: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
  paymentMethod?: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
}

/** "Google Pay", "gpay", "paytm" → UPI; "debit card" → CARD; blank stays unset (server defaults to cash). */
function paymentMethod(v: unknown): PaymentMethod | undefined {
  const s = text(v)?.toLowerCase();
  if (!s) return undefined;
  if (/upi|gpay|google ?pay|phone ?pe|paytm|bhim/.test(s)) return "UPI";
  if (/card|debit|credit|visa|master|rupay/.test(s)) return "CARD";
  if (/cash/.test(s)) return "CASH";
  const upper = s.toUpperCase();
  return (PAYMENT_METHODS as readonly string[]).includes(upper) ? (upper as PaymentMethod) : "OTHER";
}

const config: ImportConfig<ShopSaleRow> = {
  title: "Import shop sales",
  description:
    "Record sales made in the shop from a sheet. Lines with the same bill number become one order, and each sale takes stock from the same pool as online orders.",
  endpoint: "/orders/offline/import",
  template: {
    filename: "Shop-sales-template.xlsx",
    headers: ["Bill no", "Date", "SKU", "Quantity", "Unit price", "Payment", "Customer", "Phone"],
    examples: [
      ["S-1001", "12/10/2026", "DT-MED-01", 2, 1299, "Cash", "Ayesha Khan", "9876543210"],
      ["S-1001", "12/10/2026", "AT-OUD-01", 1, 1799, "Cash", "Ayesha Khan", "9876543210"],
      ["S-1002", "12/10/2026", "AT-OUD-01", 1, "", "UPI", "", ""],
    ],
  },
  mapRow: (row: SheetRow) => ({
    line: row.__line,
    bill: text(pick(row, "bill", "bill no", "bill number", "invoice", "invoice no", "receipt")),
    date: isoDate(pick(row, "date", "sale date")),
    sku: text(pick(row, "sku", "product code", "code")),
    quantity: num(pick(row, "quantity", "qty")) ?? NaN,
    unitPrice: num(pick(row, "unit price", "price", "rate", "selling price")),
    paymentMethod: paymentMethod(pick(row, "payment", "payment method", "mode", "payment mode")),
    customerName: text(pick(row, "customer", "customer name", "name")),
    customerPhone: text(pick(row, "phone", "mobile", "customer phone")),
  }),
  columns: [
    { header: "Bill", cell: (r) => r.bill ?? <span className="text-muted-foreground">—</span> },
    {
      header: "Product",
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate max-w-[14rem]">{r.title ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{r.sku}</div>
        </div>
      ),
    },
    { header: "Qty", cell: (r) => r.quantity ?? "—", className: "text-right tabular-nums" },
    {
      header: "Amount",
      cell: (r) => (r.status === "ok" ? inr(r.amount) : "—"),
      className: "text-right tabular-nums whitespace-nowrap",
    },
    {
      header: "Status",
      cell: (r) => <RowStatus error={r.status === "error"} label="Ready" message={r.message} />,
    },
  ],
  isError: (r) => r.status === "error",
  summary: (res) => [
    { label: `${res.orders} bill${res.orders === 1 ? "" : "s"}` },
    { label: `${res.units} unit${res.units === 1 ? "" : "s"}` },
    { label: inr(res.revenue) },
    ...(res.errors ? [{ label: `${res.errors} error${res.errors === 1 ? "" : "s"}`, tone: "error" as const }] : []),
  ],
  applyLabel: (res) => `Record ${res?.orders ?? ""} sale${res?.orders === 1 ? "" : "s"}`,
};

export function ShopSalesImport({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  return <ImportDialog open={open} onOpenChange={onOpenChange} config={config} onDone={onDone} />;
}
