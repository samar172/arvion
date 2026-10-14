export function inr(value: number | string | null | undefined) {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  const v = n || 0;
  const digits = Number.isInteger(v) ? 0 : 2;
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

export function dateShort(value: string | Date) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "DELIVERED") return "default";
  if (status === "FAILED" || status === "CANCELLED") return "destructive";
  if (status === "PENDING") return "outline";
  return "secondary";
}

export const CHANNEL_LABEL: Record<string, string> = {
  ONLINE: "Online",
  OFFLINE: "Shop",
};

export const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  OTHER: "Other",
  RAZORPAY: "Razorpay",
};

/** How each ledger entry reads in the stock history. */
export const MOVEMENT_LABEL: Record<string, string> = {
  RESTOCK: "Received",
  ADJUSTMENT: "Adjusted",
  SALE_ONLINE: "Online sale",
  SALE_OFFLINE: "Shop sale",
  RETURN: "Returned",
  DAMAGE: "Damaged / lost",
  IMPORT: "Imported",
};

export const MOVEMENT_TYPES = Object.keys(MOVEMENT_LABEL);

export function signed(n: number) {
  return n > 0 ? `+${n}` : String(n);
}
