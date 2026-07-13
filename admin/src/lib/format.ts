export function inr(value: number | string | null | undefined) {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return `₹${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
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
