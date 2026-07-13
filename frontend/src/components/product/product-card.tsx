"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  categoryName?: string;
  halalCertified?: boolean;
}

export default function ProductCard({
  id,
  title,
  price,
  compareAtPrice,
  imageUrl,
  categoryName,
}: ProductCardProps) {
  const { addToCart } = useCart();

  const hasSale = !!compareAtPrice && compareAtPrice > price;
  const discount = hasSale
    ? Math.round((1 - price / Number(compareAtPrice)) * 100)
    : 0;

  // Confirmation is the slide-up bag bar in the storefront layout.
  const handleAdd = () => {
    addToCart({ id, title, price, imageUrl: imageUrl || undefined });
  };

  return (
    <div className="flex flex-col bg-card border border-line rounded overflow-hidden group">
      <Link
        href={`/products/${id}`}
        className="relative aspect-square bg-paper block overflow-hidden"
      >
        {hasSale && (
          <span className="absolute top-3 left-3 z-10 bg-emerald text-sand font-sans text-[11px] tracking-wide px-2.5 py-1 rounded-sm">
            {discount}% OFF
          </span>
        )}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gold-muted font-mono text-[11px] tracking-[0.15em]">
            {(categoryName || "GIFT").toUpperCase()}
          </div>
        )}
      </Link>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {categoryName && (
          <span className="font-sans text-[10px] tracking-[0.14em] uppercase text-muted-2">
            {categoryName}
          </span>
        )}
        <Link
          href={`/products/${id}`}
          className="font-display text-lg sm:text-xl leading-tight text-ink min-h-[44px] hover:text-emerald transition-colors flex-1"
        >
          {title}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-base font-medium text-emerald">
            ₹{Number(price).toLocaleString("en-IN")}
          </span>
          {hasSale && (
            <span className="font-sans text-[13px] text-faded line-through">
              ₹{Number(compareAtPrice).toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="mt-2 border border-emerald text-emerald font-sans text-xs tracking-[0.1em] uppercase py-2.5 rounded-sm hover:bg-emerald hover:text-cream transition-colors"
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}
