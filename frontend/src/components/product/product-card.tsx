"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { SafeImage } from "@/components/ui/safe-image";
import { discountPercent, inr, type ProductSummary } from "@/lib/format";

export function WishlistButton({
  product,
  className = "",
}: {
  product: Omit<ProductSummary, "available" | "hoverImageUrl">;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const toast = useToast();
  const saved = has(product.id);
  const [popKey, setPopKey] = useState(0);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowSaved = toggle({
          id: product.id,
          title: product.title,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          imageUrl: product.imageUrl,
          categoryName: product.categoryName,
          halalCertified: product.halalCertified,
        });
        setPopKey((k) => k + 1);
        toast(nowSaved ? "Saved to your wishlist" : "Removed from wishlist");
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.title} from wishlist` : `Save ${product.title} to wishlist`}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-card/90 backdrop-blur-sm border border-line/70 text-emerald shadow-sm hover:bg-card transition ${className}`}
    >
      <Heart
        key={popKey}
        className={`h-[17px] w-[17px] ${popKey ? "animate-pop" : ""} ${
          saved ? "fill-danger text-danger" : ""
        }`}
        strokeWidth={1.75}
      />
    </button>
  );
}

export default function ProductCard({
  product,
  priority = false,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const { addToCart, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const { id, title, price, compareAtPrice, imageUrl, hoverImageUrl, categoryName, available } =
    product;
  const discount = discountPercent(price, compareAtPrice);
  const outOfStock = available !== null && available <= 0;
  const lowStock = available !== null && available > 0 && available <= 5;
  const inBag = items.find((i) => i.productId === id)?.quantity ?? 0;
  const bagFull = available !== null && inBag >= available;

  // Confirmation is the slide-up bag bar in the storefront layout.
  const handleAdd = () => {
    addToCart({ id, title, price, imageUrl: imageUrl || undefined, maxQuantity: available });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <article className="relative flex flex-col bg-card border border-line rounded overflow-hidden group transition-[box-shadow,border-color] duration-300 hover:border-gold/60 hover:shadow-[0_18px_40px_-24px_rgba(13,59,44,0.45)]">
      <Link
        href={`/products/${id}`}
        className="relative aspect-square bg-paper block overflow-hidden"
        aria-label={title}
      >
        {imageUrl ? (
          <>
            <SafeImage
              src={imageUrl}
              alt={title}
              fallbackLabel={categoryName || "Gift"}
              loading={priority ? "eager" : "lazy"}
              className={`absolute inset-0 w-full h-full object-cover transition-[transform,opacity] duration-700 ease-out-expo group-hover:scale-[1.04] ${
                hoverImageUrl ? "md:group-hover:opacity-0" : ""
              } ${outOfStock ? "grayscale-[40%]" : ""}`}
            />
            {hoverImageUrl && (
              <SafeImage
                src={hoverImageUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700 md:group-hover:opacity-100 hidden md:block"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full pattern-paper flex items-center justify-center text-gold-muted font-sans text-[11px] tracking-[0.2em] uppercase">
            {categoryName || "Gift"}
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {discount > 0 && !outOfStock && (
            <span className="bg-emerald text-sand font-sans text-[10px] sm:text-[11px] tracking-wide px-2 py-1 rounded-sm tabular">
              {discount}% off
            </span>
          )}
          {outOfStock && (
            <span className="bg-ink/85 text-cream font-sans text-[10px] sm:text-[11px] tracking-wide px-2 py-1 rounded-sm">
              Sold out
            </span>
          )}
        </div>
      </Link>

      <WishlistButton product={product} className="absolute top-2.5 right-2.5" />

      <div className="p-3 sm:p-4 flex flex-col gap-1 sm:gap-1.5 flex-1">
        <div className="flex items-center gap-2 min-h-[14px]">
          {categoryName && (
            <span className="font-sans text-[10px] tracking-[0.14em] uppercase text-muted-2 truncate">
              {categoryName}
            </span>
          )}
          {product.halalCertified && (
            <span className="font-sans text-[9px] tracking-[0.12em] uppercase text-gold-dark border border-gold/50 rounded-sm px-1.5 py-[1px] shrink-0">
              Halal
            </span>
          )}
        </div>
        <Link
          href={`/products/${id}`}
          className="font-display text-[17px] sm:text-xl leading-snug text-ink hover:text-emerald transition-colors line-clamp-2 flex-1"
        >
          {title}
        </Link>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-sans text-[15px] sm:text-base font-medium text-emerald tabular">
            {inr(price)}
          </span>
          {discount > 0 && (
            <span className="font-sans text-xs sm:text-[13px] text-faded line-through tabular">
              {inr(compareAtPrice)}
            </span>
          )}
        </div>
        {lowStock && (
          <span className="font-sans text-[11px] text-gold-dark">Only {available} left</span>
        )}
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || bagFull}
          className={`mt-2 h-10 sm:h-11 inline-flex items-center justify-center gap-2 border font-sans text-[11px] sm:text-xs tracking-[0.1em] uppercase rounded-sm transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${
            justAdded
              ? "bg-emerald border-emerald text-cream"
              : "border-emerald text-emerald hover:bg-emerald hover:text-cream"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Added
            </>
          ) : outOfStock ? (
            "Sold out"
          ) : bagFull ? (
            "All in bag"
          ) : (
            <>
              <ShoppingBag className="h-3.5 w-3.5 hidden sm:block" strokeWidth={1.75} /> Add to bag
            </>
          )}
        </button>
      </div>
    </article>
  );
}
