/** ₹1,299 — Indian digit grouping, no paise for whole rupees. */
export function inr(value: number | string | null | undefined) {
  const n = Number(value) || 0;
  // Whole rupees stay clean (₹1,299); paise always get two digits (₹279.90).
  const digits = Number.isInteger(n) ? 0 : 2;
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/** What a product card / wishlist needs, normalised from the catalog API row. */
export interface ProductSummary {
  id: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl?: string | null;
  hoverImageUrl?: string | null;
  categoryName?: string;
  halalCertified?: boolean;
  /** Sellable units (stock − reserved); null when the product has no inventory row. */
  available: number | null;
}

export function parseGallery(product: { imageUrl?: string | null; images?: string | null }) {
  const gallery: string[] = [];
  if (product.imageUrl) gallery.push(product.imageUrl);
  try {
    const extra = product.images ? JSON.parse(product.images) : [];
    if (Array.isArray(extra)) {
      for (const url of extra) if (url && !gallery.includes(url)) gallery.push(url);
    }
  } catch {
    /* images is optional JSON — ignore malformed */
  }
  return gallery;
}

export function availableStock(product: any): number | null {
  if (!product?.inventory) return null;
  return Math.max(0, product.inventory.stock - product.inventory.reserved);
}

export function toSummary(product: any): ProductSummary {
  const gallery = parseGallery(product);
  return {
    id: product.id,
    title: product.title,
    price: parseFloat(product.price),
    compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : null,
    imageUrl: gallery[0] ?? null,
    hoverImageUrl: gallery[1] ?? null,
    categoryName: product.category?.name,
    halalCertified: !!product.halalCertified,
    available: availableStock(product),
  };
}

export function discountPercent(price: number, compareAt: number | null | undefined) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

export function shortOrderId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
