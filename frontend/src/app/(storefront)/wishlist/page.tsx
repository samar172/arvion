"use client";

import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { toSummary, type ProductSummary } from "@/lib/format";

export default function WishlistPage() {
  const { items, remove, hydrated: ready } = useWishlist();
  const [live, setLive] = useState<Record<string, ProductSummary>>({});

  // Saved snapshots can go stale — refresh price/stock, and drop products that were retired.

  useEffect(() => {
    if (!ready || items.length === 0) return;
    let alive = true;
    Promise.all(
      items.map((i) =>
        api
          .get(`/catalog/${i.id}`)
          .then((res) => res.data)
          .catch((err) => (err.response?.status === 404 ? null : undefined))
      )
    ).then((rows) => {
      if (!alive) return;
      const next: Record<string, ProductSummary> = {};
      rows.forEach((row, idx) => {
        const id = items[idx].id;
        if (row === null || row?.isActive === false) remove(id);
        else if (row) next[id] = toSummary(row);
      });
      setLive(next);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <div className="mx-auto max-w-7xl w-full px-4 md:px-7 py-6 md:py-12 flex-1">
      <span className="eyebrow">Saved for later</span>
      <h1 className="font-display font-medium text-[38px] md:text-[52px] leading-tight text-ink mt-1.5 mb-6 md:mb-8">
        Wishlist {items.length > 0 && <span className="font-sans text-base text-muted align-middle">({items.length})</span>}
      </h1>

      {!ready ? (
        <ProductGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-6 w-6" strokeWidth={1.5} />}
          title="Nothing saved yet"
          body="Tap the heart on any gift to keep it here for later."
          actionLabel="Explore gifts"
          actionHref="/category/all"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {items.map((item, i) => (
            <div key={item.id} className="flex animate-fadeUp [&>article]:w-full" style={{ animationDelay: `${i * 40}ms` }}>
              <ProductCard product={live[item.id] ?? { ...item, available: null, hoverImageUrl: null }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
