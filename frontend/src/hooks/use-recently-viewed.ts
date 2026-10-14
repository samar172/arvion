"use client";

import { useEffect, useState } from "react";
import type { ProductSummary } from "@/lib/format";

const KEY = "arvion_recent";
const MAX = 10;

function read(): ProductSummary[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/** Records `current` as viewed and returns the other recently viewed products. */
export function useRecentlyViewed(current: ProductSummary | null) {
  const [items, setItems] = useState<ProductSummary[]>([]);

  useEffect(() => {
    if (!current) return;
    const previous = read().filter((p) => p.id !== current.id);
    setItems(previous);
    try {
      localStorage.setItem(KEY, JSON.stringify([current, ...previous].slice(0, MAX)));
    } catch {
      /* storage blocked */
    }
  }, [current]);

  return items;
}
