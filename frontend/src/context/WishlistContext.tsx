"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ProductSummary } from "@/lib/format";

/** A saved product. Kept as a snapshot so the wishlist renders without a fetch. */
export type WishlistItem = Omit<ProductSummary, "available" | "hoverImageUrl">;

interface WishlistContextType {
  items: WishlistItem[];
  /** False until the saved list has been read from storage. */
  hydrated: boolean;
  has: (id: string) => boolean;
  /** Adds or removes; returns true when the product is now saved. */
  toggle: (item: WishlistItem) => boolean;
  remove: (id: string) => void;
}

const STORAGE_KEY = "arvion_wishlist";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      /* corrupt or blocked storage — start empty */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Don't overwrite the saved list with [] before it has been read.
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked */
    }
  }, [items, hydrated]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback(
    (item: WishlistItem) => {
      const saved = items.some((i) => i.id === item.id);
      setItems((prev) =>
        saved ? prev.filter((i) => i.id !== item.id) : [item, ...prev]
      );
      return !saved;
    },
    [items]
  );

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    []
  );

  return (
    <WishlistContext.Provider value={{ items, hydrated, has, toggle, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
