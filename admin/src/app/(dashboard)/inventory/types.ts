export type StockStatus = "in" | "low" | "out";

export interface InventoryRow {
  productId: string;
  title: string;
  sku: string;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: string; name: string } | null;
  price: number;
  costPrice: number | null;
  stock: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  status: StockStatus;
  sold30: { online: number; offline: number; total: number };
  updatedAt: string;
}

export interface InventorySummary {
  skus: number;
  units: number;
  reserved: number;
  retailValue: number;
  costValue: number;
  missingCost: number;
  low: number;
  out: number;
  sold30Online: number;
  sold30Offline: number;
}

export interface Movement {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  orderId: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  product: { title: string; sku: string; imageUrl: string | null };
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
};
