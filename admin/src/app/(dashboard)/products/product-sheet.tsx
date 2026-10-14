import { Badge } from "@/components/ui/badge";
import { RowStatus, type ImportConfig } from "@/components/import/import-dialog";
import { bool, exportSheet, num, pick, text, today, type Column, type SheetRow } from "@/lib/excel";

/** Same headers for the template, the export and the import, so a sheet round-trips. */
export const PRODUCT_HEADERS = [
  "SKU",
  "Title",
  "Description",
  "Category",
  "Price",
  "Compare at price",
  "Cost price",
  "Stock",
  "Halal",
  "Featured",
  "Active",
  "Image URL",
  "Gallery",
];

export interface ProductImportRow {
  line: number;
  sku?: string;
  title?: string;
  description?: string;
  category?: string;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock?: number;
  halalCertified?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  imageUrl?: string;
  images?: string[];
}

export function parseGallery(images: string | null | undefined): string[] {
  try {
    const list = images ? JSON.parse(images) : [];
    return Array.isArray(list) ? list.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function mapRow(row: SheetRow): ProductImportRow {
  const gallery = text(pick(row, "gallery", "more images", "images"));
  return {
    line: row.__line,
    sku: text(pick(row, "sku")),
    title: text(pick(row, "title", "name", "product")),
    description: text(pick(row, "description")),
    category: text(pick(row, "category", "collection")),
    price: num(pick(row, "price", "selling price")),
    compareAtPrice: num(pick(row, "compare at price", "mrp", "original price")),
    costPrice: num(pick(row, "cost price", "cost", "purchase price")),
    stock: num(pick(row, "stock", "quantity", "qty", "on hand")),
    halalCertified: bool(pick(row, "halal", "halal certified")),
    isFeatured: bool(pick(row, "featured")),
    isActive: bool(pick(row, "active", "visible", "status")),
    imageUrl: text(pick(row, "image url", "image")),
    images: gallery
      ? gallery
          .split(/[,|\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
  };
}

const ACTION: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  create: { label: "Create", variant: "default" },
  update: { label: "Update", variant: "secondary" },
  unchanged: { label: "No change", variant: "outline" },
};

export const productImportConfig: ImportConfig<ProductImportRow> = {
  title: "Import products",
  description:
    "Create new products and update existing ones by SKU. Blank cells leave a field as it is. A Stock value replaces the on-hand count (logged in stock history), so clear that column if you only want to change product details.",
  endpoint: "/catalog/import",
  template: {
    filename: "Products-template.xlsx",
    headers: PRODUCT_HEADERS,
    examples: [
      [
        "BK-QRN-01",
        "Al-Quran Kareem — Leather Bound",
        "Uthmani script with English translation, gilded edges.",
        "Qurans & Books",
        1499,
        1799,
        820,
        40,
        "No",
        "Yes",
        "Yes",
        "https://images.unsplash.com/photo-1616422840391-fa670d4b2ae7",
        "",
      ],
      [
        "DT-MED-01",
        "Premium Medjool Dates — 1 kg",
        "Jumbo, soft Medjool dates in a gift tin.",
        "Dates & Sweets",
        1299,
        "",
        760,
        50,
        "Yes",
        "No",
        "Yes",
        "",
        "",
      ],
    ],
  },
  mapRow,
  columns: [
    { header: "SKU", cell: (r) => <span className="font-mono text-xs">{r.sku || "—"}</span> },
    { header: "Product", cell: (r) => r.title ?? <span className="text-muted-foreground">—</span> },
    {
      header: "Action",
      cell: (r) =>
        r.action === "error" ? (
          <Badge variant="destructive">Error</Badge>
        ) : (
          <Badge variant={ACTION[r.action]?.variant ?? "outline"}>{ACTION[r.action]?.label ?? r.action}</Badge>
        ),
    },
    {
      header: "Details",
      cell: (r) => (
        <RowStatus
          error={r.action === "error"}
          message={r.message}
          label={r.action === "create" ? "New product" : r.changes?.length ? r.changes.join(", ") : "—"}
        />
      ),
    },
  ],
  isError: (r) => r.action === "error",
  isNoop: (r) => r.action === "unchanged",
  summary: (res) => [
    ...(res.create ? [{ label: `${res.create} new` }] : []),
    ...(res.update ? [{ label: `${res.update} updated` }] : []),
    ...(res.unchanged ? [{ label: `${res.unchanged} unchanged`, tone: "muted" as const }] : []),
    ...(res.errors ? [{ label: `${res.errors} errors`, tone: "error" as const }] : []),
    ...(res.newCategories?.length
      ? [{ label: `Creates categories: ${res.newCategories.join(", ")}`, tone: "muted" as const }]
      : []),
  ],
  applyLabel: (res) => {
    const n = (res?.create ?? 0) + (res?.update ?? 0);
    return n ? `Import ${n} product${n === 1 ? "" : "s"}` : "Nothing to import";
  },
};

const yesNo = (v: boolean | null | undefined) => (v ? "Yes" : "No");
const money = (v: unknown) => (v === null || v === undefined || v === "" ? "" : Number(v));

const EXPORT_COLUMNS: Column<any>[] = [
  { header: "SKU", value: (p) => p.sku, width: 16 },
  { header: "Title", value: (p) => p.title, width: 36 },
  { header: "Description", value: (p) => p.description, width: 50 },
  { header: "Category", value: (p) => p.category?.name ?? "", width: 18 },
  { header: "Price", value: (p) => money(p.price) },
  { header: "Compare at price", value: (p) => money(p.compareAtPrice) },
  { header: "Cost price", value: (p) => money(p.costPrice) },
  { header: "Stock", value: (p) => p.inventory?.stock ?? 0 },
  { header: "Halal", value: (p) => yesNo(p.halalCertified) },
  { header: "Featured", value: (p) => yesNo(p.isFeatured) },
  { header: "Active", value: (p) => yesNo(p.isActive) },
  { header: "Image URL", value: (p) => p.imageUrl ?? "", width: 40 },
  { header: "Gallery", value: (p) => parseGallery(p.images).join(" | "), width: 40 },
];

export function exportProducts(products: any[]) {
  return exportSheet(`Products-${today()}.xlsx`, products, EXPORT_COLUMNS, "Products");
}
